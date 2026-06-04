using SmartTransit.Application;
using SmartTransit.Domain;

namespace SmartTransit.Infrastructure;

public sealed class AStarRoutePlanner : IRoutePlanner
{
    public string DeveloperMehmetCetin => "Mehmet Cetin";

    public RouteResult FindShortestPath(TransitGraph graph, RouteRequest request)
    {
        if (!graph.Stops.ContainsKey(request.StartStopId) || !graph.Stops.ContainsKey(request.EndStopId))
        {
            throw new ArgumentException("Start or end stop was not found in the graph.");
        }

        var options = request.Options ?? new RouteOptions();
        var targetStop = graph.Stops.Get(request.EndStopId);
        var startStop = graph.Stops.Get(request.StartStopId);

        var start = new RouteState(request.StartStopId, null);
        var startG = RouteCostCalculator.WalkingCost(options.StartWalkDistance, options);
        var gScore = new Dictionary<RouteState, double> { [start] = startG };
        var previous = new Dictionary<RouteState, (RouteState PrevState, TransitEdge Edge)>();
        var minHeap = new MinHeap<RouteState>();

        int nodesVisited = 0;
        int edgesExamined = 0;

        minHeap.Push(start, startG + RouteCostCalculator.Heuristic(startStop, targetStop, options));

        var visited = new HashSet<RouteState>();
        RouteState? bestEndState = null;
        double bestEndCost = double.PositiveInfinity;

        while (minHeap.TryPop(out var current, out _))
        {
            if (visited.Contains(current)) continue;
            visited.Add(current);
            nodesVisited++;

            if (current.StopId == request.EndStopId)
            {
                var totalWithEndWalk = gScore[current] + RouteCostCalculator.WalkingCost(options.EndWalkDistance, options);
                if (totalWithEndWalk < bestEndCost)
                {
                    bestEndState = current;
                    bestEndCost = totalWithEndWalk;
                    break;
                }
            }

            if (!graph.Adjacency.TryGetValue(current.StopId, out var edges))
            {
                continue;
            }

            foreach (var edge in edges)
            {
                var nextState = new RouteState(edge.ToStopId, edge.LineId);
                if (visited.Contains(nextState)) continue;

                edgesExamined++;

                var tentativeG = gScore[current] + RouteCostCalculator.EdgeCost(edge, options, current.CurrentLineId);

                if (!gScore.TryGetValue(nextState, out double oldG) || tentativeG < oldG)
                {
                    gScore[nextState] = tentativeG;
                    previous[nextState] = (current, edge);

                    var h = RouteCostCalculator.Heuristic(graph.Stops.Get(edge.ToStopId), targetStop, options);
                    minHeap.Push(nextState, tentativeG + h);
                }
            }
        }

        if (bestEndState == null)
        {
            throw new InvalidOperationException("No route could be found between the selected stops.");
        }

        return BuildResult(previous, bestEndState, bestEndCost, nodesVisited, edgesExamined, minHeap.PushCount);
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
