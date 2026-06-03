namespace SmartTransit.Api.Core;

public sealed record Stop(int Id, string Name, double Latitude, double Longitude);

public sealed record TransitEdge(
    int FromStopId,
    int ToStopId,
    string LineId,
    double TravelMinutes,
    double DistanceMeters);

public sealed class TransitGraph
{
    private readonly Dictionary<int, Stop> _stops = new();
    private readonly Dictionary<int, List<TransitEdge>> _adjacency = new();

    public IReadOnlyDictionary<int, Stop> Stops => _stops;
    public IReadOnlyDictionary<int, List<TransitEdge>> Adjacency => _adjacency;

    public void AddStop(Stop stop)
    {
        _stops[stop.Id] = stop;
        _adjacency.TryAdd(stop.Id, []);
    }

    public void AddEdge(TransitEdge edge)
    {
        if (!_stops.ContainsKey(edge.FromStopId) || !_stops.ContainsKey(edge.ToStopId))
        {
            throw new InvalidOperationException("Both edge stops must exist before adding an edge.");
        }

        _adjacency[edge.FromStopId].Add(edge);
    }
}

public sealed class RouteOptions
{
    public double TransferPenaltyMinutes { get; init; } = 8;
    public double WalkPenaltyPer100Meters { get; init; } = 1.5;
}

public sealed record RouteRequest(int StartStopId, int EndStopId, RouteOptions? Options = null);

public sealed record RouteStep(int FromStopId, int ToStopId, string LineId, double TravelMinutes, double DistanceMeters);

public sealed class RouteResult
{
    public required IReadOnlyList<int> PathStopIds { get; init; }
    public required IReadOnlyList<RouteStep> Steps { get; init; }
    public required double TotalMinutes { get; init; }
    public required double TotalCost { get; init; }
}

public interface IRoutePlanner
{
    RouteResult FindShortestPath(TransitGraph graph, RouteRequest request);
}

public sealed class DijkstraRoutePlanner : IRoutePlanner
{
    public RouteResult FindShortestPath(TransitGraph graph, RouteRequest request)
    {
        if (!graph.Stops.ContainsKey(request.StartStopId) || !graph.Stops.ContainsKey(request.EndStopId))
        {
            throw new ArgumentException("Start or end stop was not found in the graph.");
        }

        var options = request.Options ?? new RouteOptions();
        var start = new RouteState(request.StartStopId, null);
        var distances = new Dictionary<RouteState, double> { [start] = 0 };
        var previous = new Dictionary<RouteState, (RouteState PrevState, TransitEdge Edge)>();
        var queue = new PriorityQueue<RouteState, double>();
        queue.Enqueue(start, 0);

        RouteState? bestEndState = null;
        var bestEndCost = double.PositiveInfinity;

        while (queue.TryDequeue(out var current, out var cost))
        {
            if (!distances.TryGetValue(current, out var knownCost) || cost > knownCost)
            {
                continue;
            }

            if (current.StopId == request.EndStopId && cost < bestEndCost)
            {
                bestEndState = current;
                bestEndCost = cost;
            }

            if (!graph.Adjacency.TryGetValue(current.StopId, out var edges))
            {
                continue;
            }

            foreach (var edge in edges)
            {
                var transferPenalty = 0d;
                if (current.CurrentLineId is not null && current.CurrentLineId != edge.LineId)
                {
                    transferPenalty = options.TransferPenaltyMinutes;
                }

                var walkPenalty = (edge.DistanceMeters / 100d) * options.WalkPenaltyPer100Meters;
                var nextCost = cost + edge.TravelMinutes + walkPenalty + transferPenalty;
                var nextState = new RouteState(edge.ToStopId, edge.LineId);

                if (!distances.TryGetValue(nextState, out var oldCost) || nextCost < oldCost)
                {
                    distances[nextState] = nextCost;
                    previous[nextState] = (current, edge);
                    queue.Enqueue(nextState, nextCost);
                }
            }
        }

        if (bestEndState is null)
        {
            throw new InvalidOperationException("No route found between selected stops.");
        }

        return BuildResult(previous, bestEndState, bestEndCost);
    }

    private static RouteResult BuildResult(
        IReadOnlyDictionary<RouteState, (RouteState PrevState, TransitEdge Edge)> previous,
        RouteState endState,
        double totalCost)
    {
        var steps = new List<RouteStep>();
        var stopIds = new List<int> { endState.StopId };
        var cursor = endState;
        var totalMinutes = 0d;

        while (previous.TryGetValue(cursor, out var prev))
        {
            var edge = prev.Edge;
            steps.Add(new RouteStep(edge.FromStopId, edge.ToStopId, edge.LineId, edge.TravelMinutes, edge.DistanceMeters));
            totalMinutes += edge.TravelMinutes;
            stopIds.Add(edge.FromStopId);
            cursor = prev.PrevState;
        }

        steps.Reverse();
        stopIds.Reverse();

        return new RouteResult
        {
            PathStopIds = stopIds,
            Steps = steps,
            TotalMinutes = totalMinutes,
            TotalCost = totalCost
        };
    }

    private sealed record RouteState(int StopId, string? CurrentLineId);
}
