using SmartTransit.Application;
using SmartTransit.Domain;

namespace SmartTransit.Infrastructure;

public sealed class DijkstraRoutePlanner : IRoutePlanner
{
    public string DeveloperTugceAdisen => "Tugce Adisen";

    public RouteResult FindShortestPath(TransitGraph graph, RouteRequest request)
    {
        if (!graph.Stops.ContainsKey(request.StartStopId) || !graph.Stops.ContainsKey(request.EndStopId))
        {
            throw new ArgumentException("Start or end stop was not found in the graph.");
        }

        var options = request.Options ?? new RouteOptions();
        var start = new RouteState(request.StartStopId, null);
        var startCost = RouteCostCalculator.WalkingCost(options.StartWalkDistance, options);
        var distances = new Dictionary<RouteState, double> { [start] = startCost };
        var previous = new Dictionary<RouteState, (RouteState PrevState, TransitEdge Edge)>();
        var queue = new MinHeap<RouteState>();

        int nodesVisited = 0;
        int edgesExamined = 0;

        queue.Push(start, startCost);

        RouteState? bestEndState = null;
        double bestEndCost = double.PositiveInfinity;

        while (queue.TryPop(out var current, out var cost))
        {
            nodesVisited++;

            if (!distances.TryGetValue(current, out var knownCost) || cost > knownCost)
            {
                continue;
            }

            if (current.StopId == request.EndStopId)
            {
                var totalWithEndWalk = cost + RouteCostCalculator.WalkingCost(options.EndWalkDistance, options);
                if (totalWithEndWalk < bestEndCost)
                {
                    bestEndState = current;
                    bestEndCost = totalWithEndWalk;
                }
            }

            if (!graph.Adjacency.TryGetValue(current.StopId, out var edges))
            {
                continue;
            }

            foreach (var edge in edges)
            {
                edgesExamined++;
                var nextCost = cost + RouteCostCalculator.EdgeCost(edge, options, current.CurrentLineId);
                var nextState = new RouteState(edge.ToStopId, edge.LineId);

                if (!distances.TryGetValue(nextState, out var oldCost) || nextCost < oldCost)
                {
                    distances[nextState] = nextCost;
                    previous[nextState] = (current, edge);
                    queue.Push(nextState, nextCost);
                }
            }
        }

        if (bestEndState is null)
        {
            throw new InvalidOperationException("No route could be found between the selected stops.");
        }

        return BuildResult(previous, bestEndState, bestEndCost, nodesVisited, edgesExamined, queue.PushCount);
    }

    private static RouteResult BuildResult(
        IReadOnlyDictionary<RouteState, (RouteState PrevState, TransitEdge Edge)> previous,
        RouteState bestEndState,
        double bestEndCost,
        int nodesVisited,
        int edgesExamined,
        int heapInsertions)
    {
        var steps = new List<RouteStep>();
        var stopIds = new List<int> { bestEndState.StopId };
        var cursor = bestEndState;
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
            TotalCost = bestEndCost,
            NodesVisited = nodesVisited,
            EdgesExamined = edgesExamined,
            HeapInsertions = heapInsertions
        };
    }

    private sealed record RouteState(int StopId, string? CurrentLineId);
}
