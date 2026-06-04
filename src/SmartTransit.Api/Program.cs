using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SmartTransit.Application;
using SmartTransit.Domain;
using SmartTransit.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS so the python-served frontend can call the C# API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// Initialize and register domain/infrastructure structures
var (seedStops, seedLines) = CityDataGenerator.GetData();
var graph = CityDataGenerator.BuildGraph(seedStops, seedLines);
var kdTree = new KdTree(seedStops);

var lineTable = new HashTable<string, CityLine>();
foreach (var line in seedLines)
{
    lineTable.Set(line.Id, line);
}

builder.Services.AddSingleton(graph);
builder.Services.AddSingleton(kdTree);
builder.Services.AddSingleton(lineTable);
builder.Services.AddSingleton<DijkstraRoutePlanner>();
builder.Services.AddSingleton<AStarRoutePlanner>();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartTransit.Api v1");
    });
}

// GET /api/data: Serves the city network data to the frontend
app.MapGet("/api/data", (TransitGraph g, KdTree tree, HashTable<string, CityLine> lineTable) =>
{
    var (stops, lines) = CityDataGenerator.GetData();

    // Map stops to frontend format: string IDs "S01", "S02" etc.
    var stopList = stops.Select(s => new
    {
        id = $"S{s.Id:D2}",
        name = s.Name,
        x = s.Latitude, // Latitude holds X
        y = s.Longitude // Longitude holds Y
    }).ToList();

    var lineList = lines.Select(l => new
    {
        id = l.Id,
        name = l.Name,
        type = l.Type,
        color = l.Color,
        speedFactor = l.SpeedFactor,
        stops = l.Stops.Select(sid => $"S{sid:D2}").ToList()
    }).ToList();

    // Reconstruct all edges for frontend drawing
    var edgeList = new List<object>();
    foreach (var line in lines)
    {
        for (int i = 0; i < line.Stops.Length - 1; i++)
        {
            var fromStop = stops.First(s => s.Id == line.Stops[i]);
            var toStop = stops.First(s => s.Id == line.Stops[i + 1]);

            double dx = fromStop.Latitude - toStop.Latitude;
            double dy = fromStop.Longitude - toStop.Longitude;
            double distance = Math.Sqrt(dx * dx + dy * dy);
            double duration = (distance / 50.0) * line.SpeedFactor;

            edgeList.Add(new
            {
                from = $"S{line.Stops[i]:D2}",
                to = $"S{line.Stops[i + 1]:D2}",
                distance = Math.Round(distance),
                duration = Math.Round(duration, 1),
                lineId = line.Id,
                lineName = line.Name,
                lineType = line.Type,
                lineColor = line.Color
            });
        }
    }

    var lineColors = lines.ToDictionary(
        l => l.Id,
        l => new { color = l.Color, name = l.Name, type = l.Type }
    );

    // Compute structure stats on C# side
    int edgeCount = 0;
    foreach (var list in g.Adjacency.Values)
    {
        edgeCount += list.Count;
    }
    double avgDegree = g.Stops.Size > 0 ? (double)edgeCount / g.Stops.Size : 0;

    var stats = new
    {
        kdTree = new
        {
            nodeCount = tree.NodeCount,
            actualHeight = tree.GetHeight()
        },
        graph = new
        {
            vertexCount = g.Stops.Size,
            edgeCount = edgeCount,
            avgDegree = Math.Round(avgDegree, 2)
        },
        stopTable = g.Stops.GetStats(),
        lineTable = lineTable.GetStats()
    };

    return Results.Json(new
    {
        stops = stopList,
        lines = lineList,
        edges = edgeList,
        lineColors = lineColors,
        MAP_WIDTH = 1000,
        MAP_HEIGHT = 700,
        stats = stats
    }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = null });
});

// POST /api/knn: KNN search using C# KdTree
app.MapPost("/api/knn", (KnnApiRequest request, KdTree tree) =>
{
    var startTime = DateTime.UtcNow;

    // Search nearest
    var knnResults = tree.Knn(request.X, request.Y, request.K);

    var endTime = DateTime.UtcNow;
    var executionTimeMs = (endTime - startTime).TotalMilliseconds;

    var resultsMapped = knnResults.Select(r => new
    {
        id = $"S{r.Point.Id:D2}",
        name = r.Point.Name,
        x = r.Point.Latitude,
        y = r.Point.Longitude,
        distance = r.Distance
    }).ToList();

    return Results.Ok(new
    {
        results = resultsMapped,
        stats = new
        {
            algorithm = "C# KNN (KD-Tree)",
            k = request.K,
            queryPoint = new { x = request.X, y = request.Y },
            resultCount = resultsMapped.Count,
            executionTimeMs = Math.Round(executionTimeMs, 3),
            treeHeight = tree.GetHeight(),
            totalNodes = tree.NodeCount
        }
    });
});

// POST /api/route: Pathfinding using C# Dijkstra or AStar
app.MapPost("/api/route", async (RouteApiRequest request, TransitGraph g, DijkstraRoutePlanner dijkstraPlanner, AStarRoutePlanner aStarPlanner, System.Net.Http.IHttpClientFactory httpClientFactory) =>
{
    int startId = int.Parse(request.StartStopId.Replace("S", ""));
    int endId = int.Parse(request.EndStopId.Replace("S", ""));

    var criterion = request.Criterion?.ToLowerInvariant() switch
    {
        "distance" => RouteCriterion.Distance,
        "transfers" => RouteCriterion.MinTransfers,
        _ => RouteCriterion.Duration
    };

    var options = new SmartTransit.Application.RouteOptions
    {
        Criterion = criterion,
        TransferPenaltyMinutes = request.TransferPenalty,
        StartWalkDistance = request.StartWalkDistance ?? 0,
        EndWalkDistance = request.EndWalkDistance ?? 0
    };

    var routeRequest = new RouteRequest(startId, endId, options);

    var startTime = DateTime.UtcNow;

    IRoutePlanner activePlanner = request.Algorithm.ToLower() == "astar" 
        ? aStarPlanner 
        : dijkstraPlanner;

    RouteResult result;
    try
    {
        result = activePlanner.FindShortestPath(g, routeRequest);
    }
    catch (Exception ex)
    {
        return Results.Ok(new { found = false, error = ex.Message });
    }

    var endTime = DateTime.UtcNow;
    var executionTimeMs = (endTime - startTime).TotalMilliseconds;

    // Run the other planner for comparison
    IRoutePlanner compPlanner = request.Algorithm.ToLower() == "astar" 
        ? dijkstraPlanner 
        : aStarPlanner;
    RouteResult compResult;
    var compStartTime = DateTime.UtcNow;
    try
    {
        compResult = compPlanner.FindShortestPath(g, routeRequest);
    }
    catch
    {
        compResult = new RouteResult 
        { 
            TotalCost = -1, 
            PathStopIds = new List<int>(), 
            Steps = new List<RouteStep>(), 
            TotalMinutes = 0 
        };
    }
    var compExecutionTimeMs = (DateTime.UtcNow - compStartTime).TotalMilliseconds;

    // Reconstruct the response matching the frontend expectations
    var pathStopIds = result.PathStopIds.Select(id => $"S{id:D2}").ToList();

    var edgesMapped = new List<object>();
    double totalDistance = 0;
    double totalDuration = 0;

    var (stopsRaw, linesRaw) = CityDataGenerator.GetData();

    for (int i = 0; i < result.Steps.Count; i++)
    {
        var step = result.Steps[i];
        var fromStop = g.Stops.Get(step.FromStopId);
        var toStop = g.Stops.Get(step.ToStopId);
        var line = linesRaw.First(l => l.Id == step.LineId);

        edgesMapped.Add(new
        {
            from = $"S{step.FromStopId:D2}",
            to = $"S{step.ToStopId:D2}",
            distance = step.DistanceMeters,
            duration = step.TravelMinutes,
            lineId = step.LineId,
            lineName = line.Name,
            lineType = line.Type,
            lineColor = line.Color
        });

        totalDistance += step.DistanceMeters;
        totalDuration += step.TravelMinutes;
    }

    // Build segments by grouping by lineId
    var segments = new List<object>();
    int transfers = 0;

    if (result.Steps.Count > 0)
    {
        var currentSteps = new List<RouteStep>();
        string currentLineId = result.Steps[0].LineId;

        for (int i = 0; i < result.Steps.Count; i++)
        {
            var step = result.Steps[i];
            if (step.LineId == currentLineId)
            {
                currentSteps.Add(step);
            }
            else
            {
                var segmentStops = new List<string> { $"S{currentSteps[0].FromStopId:D2}" };
                segmentStops.AddRange(currentSteps.Select(s => $"S{s.ToStopId:D2}"));

                var lineInfo = linesRaw.First(l => l.Id == currentLineId);
                var segEdges = currentSteps.Select(s => new
                {
                    from = $"S{s.FromStopId:D2}",
                    to = $"S{s.ToStopId:D2}",
                    distance = s.DistanceMeters,
                    duration = s.TravelMinutes,
                    lineId = s.LineId,
                    lineName = lineInfo.Name,
                    lineType = lineInfo.Type,
                    lineColor = lineInfo.Color
                }).ToList();

                segments.Add(new
                {
                    lineId = currentLineId,
                    lineName = lineInfo.Name,
                    lineColor = lineInfo.Color,
                    lineType = lineInfo.Type,
                    stops = segmentStops,
                    edges = segEdges,
                    distance = currentSteps.Sum(s => s.DistanceMeters),
                    duration = currentSteps.Sum(s => s.TravelMinutes)
                });

                transfers++;
                currentSteps = new List<RouteStep> { step };
                currentLineId = step.LineId;
            }
        }

        // Add last segment
        if (currentSteps.Count > 0)
        {
            var segmentStops = new List<string> { $"S{currentSteps[0].FromStopId:D2}" };
            segmentStops.AddRange(currentSteps.Select(s => $"S{s.ToStopId:D2}"));

            var lineInfo = linesRaw.First(l => l.Id == currentLineId);
            var segEdges = currentSteps.Select(s => new
            {
                from = $"S{s.FromStopId:D2}",
                to = $"S{s.ToStopId:D2}",
                distance = s.DistanceMeters,
                duration = s.TravelMinutes,
                lineId = s.LineId,
                lineName = lineInfo.Name,
                lineType = lineInfo.Type,
                lineColor = lineInfo.Color
            }).ToList();

            segments.Add(new
            {
                lineId = currentLineId,
                lineName = lineInfo.Name,
                lineColor = lineInfo.Color,
                lineType = lineInfo.Type,
                stops = segmentStops,
                edges = segEdges,
                distance = currentSteps.Sum(s => s.DistanceMeters),
                duration = currentSteps.Sum(s => s.TravelMinutes)
            });
        }
    }

    var stats = new
    {
        algorithm = request.Algorithm.ToLower() == "astar" ? "C# A*" : "C# Dijkstra",
        criterion = request.Criterion,
        transferPenalty = request.TransferPenalty,
        nodesVisited = result.NodesVisited,
        edgesExamined = result.EdgesExamined,
        heapInsertions = result.HeapInsertions,
        totalVertices = g.Stops.Size,
        executionTimeMs = Math.Round(executionTimeMs, 3)
    };

    var compStats = new
    {
        algorithm = request.Algorithm.ToLower() == "astar" ? "C# Dijkstra" : "C# A*",
        criterion = request.Criterion,
        transferPenalty = request.TransferPenalty,
        nodesVisited = compResult.NodesVisited,
        edgesExamined = compResult.EdgesExamined,
        heapInsertions = compResult.HeapInsertions,
        totalVertices = g.Stops.Size,
        executionTimeMs = Math.Round(compExecutionTimeMs, 3)
    };

    // Call AI Service
    object aiResponse = null;
    try
    {
        var aiUrl = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://localhost:8000/api/ai/analyze";
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(3); // Don't block too long if AI service is down
        
        var startStopName = stopsRaw.FirstOrDefault(s => s.Id == startId)?.Name ?? "Bilinmiyor";
        var endStopName = stopsRaw.FirstOrDefault(s => s.Id == endId)?.Name ?? "Bilinmiyor";

        var payload = new
        {
            startStopName = startStopName,
            endStopName = endStopName,
            totalMinutes = totalDuration,
            totalDistance = totalDistance,
            transfers = transfers,
            segments = segments.Select(s => new {
                lineName = s.GetType().GetProperty("lineName").GetValue(s, null),
                lineColor = s.GetType().GetProperty("lineColor").GetValue(s, null),
                stops = s.GetType().GetProperty("stops").GetValue(s, null),
                duration = s.GetType().GetProperty("duration").GetValue(s, null),
                distance = s.GetType().GetProperty("distance").GetValue(s, null)
            })
        };

        var response = await client.PostAsJsonAsync(aiUrl, payload);
        if (response.IsSuccessStatusCode)
        {
            aiResponse = await response.Content.ReadFromJsonAsync<object>();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"AI Service Error: {ex.Message}");
    }

    return Results.Ok(new
    {
        path = pathStopIds,
        edges = edgesMapped,
        segments = segments,
        totalCost = result.TotalCost,
        totalDistance = totalDistance,
        totalDuration = totalDuration,
        transfers = transfers,
        startWalkDistance = request.StartWalkDistance ?? 0,
        endWalkDistance = request.EndWalkDistance ?? 0,
        found = true,
        stats = stats,
        compResult = new
        {
            found = compResult.TotalCost >= 0,
            totalCost = compResult.TotalCost,
            stats = compStats
        },
        ai = aiResponse
    });
});

app.Run();

// API Model Classes
public record KnnApiRequest(double X, double Y, int K);
public record RouteApiRequest(
    string StartStopId,
    string EndStopId,
    string Algorithm,
    string Criterion,
    double TransferPenalty,
    double? StartWalkDistance = null,
    double? EndWalkDistance = null);
