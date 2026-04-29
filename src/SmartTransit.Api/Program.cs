using SmartTransit.Api.Core;
using TransitRouteOptions = SmartTransit.Api.Core.RouteOptions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IRoutePlanner, DijkstraRoutePlanner>();
builder.Services.AddSingleton(CreateSeedGraph());
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartTransit.Api v1");
    });
}

app.UseHttpsRedirection();

app.MapPost("/api/route", (RouteRequest request, IRoutePlanner planner, TransitGraph graph) =>
{
    var result = planner.FindShortestPath(graph, request with { Options = request.Options ?? new TransitRouteOptions() });
    return Results.Ok(result);
})
.WithName("FindShortestRoute")
.WithOpenApi();

app.Run();

static TransitGraph CreateSeedGraph()
{
    var graph = new TransitGraph();

    graph.AddStop(new Stop(1, "Merkez", 41.009, 28.972));
    graph.AddStop(new Stop(2, "Universite", 41.013, 28.985));
    graph.AddStop(new Stop(3, "Hastane", 41.020, 28.994));
    graph.AddStop(new Stop(4, "Otogar", 41.030, 29.004));
    graph.AddStop(new Stop(5, "Sahil", 41.005, 29.010));

    graph.AddEdge(new TransitEdge(1, 2, "M1", 6, 450));
    graph.AddEdge(new TransitEdge(2, 3, "M1", 5, 300));
    graph.AddEdge(new TransitEdge(3, 4, "M1", 7, 500));
    graph.AddEdge(new TransitEdge(2, 5, "B2", 8, 700));
    graph.AddEdge(new TransitEdge(5, 4, "B2", 10, 850));
    graph.AddEdge(new TransitEdge(1, 5, "T3", 9, 650));

    return graph;
}
