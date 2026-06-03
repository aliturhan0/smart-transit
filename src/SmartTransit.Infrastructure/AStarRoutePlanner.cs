using System;
using System.Collections.Generic;
using SmartTransit.Application;
using SmartTransit.Domain;

namespace SmartTransit.Infrastructure
{
    public sealed class AStarRoutePlanner : IRoutePlanner
    {
        // Code Defense gereksinimi: Geliştirici imzası
        public string DeveloperMehmetCetin => "Mehmet Cetin";

        public RouteResult FindShortestPath(TransitGraph graph, RouteRequest request)
        {
            if (!graph.Stops.ContainsKey(request.StartStopId) || !graph.Stops.ContainsKey(request.EndStopId))
            {
                throw new ArgumentException("Start or end stop was not found in the graph.");
            }

            var options = request.Options ?? new RouteOptions();
            var targetStop = graph.Stops.Get(request.EndStopId);

            var start = new RouteState(request.StartStopId, null);
            var gScore = new Dictionary<RouteState, double> { [start] = 0 };
            var previous = new Dictionary<RouteState, (RouteState PrevState, TransitEdge Edge)>();
            var minHeap = new PriorityQueue<RouteState, double>();

            // İstatistik sayaçları
            int nodesVisited = 0;
            int edgesExamined = 0;
            int heapInsertions = 0;

            minHeap.Enqueue(start, Heuristic(graph.Stops.Get(request.StartStopId), targetStop));
            heapInsertions++;

            var visited = new HashSet<RouteState>();
            RouteState? bestEndState = null;
            double bestEndCost = double.PositiveInfinity;

            while (minHeap.TryDequeue(out var current, out var fScore))
            {
                if (visited.Contains(current)) continue;
                visited.Add(current);
                nodesVisited++;

                if (current.StopId == request.EndStopId && gScore[current] < bestEndCost)
                {
                    bestEndState = current;
                    bestEndCost = gScore[current];
                    break; // Since it's A*, first dequeue of goal is optimal if heuristic is consistent/admissible
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

                    double transferPenalty = 0;
                    if (current.CurrentLineId != null && edge.LineId != current.CurrentLineId)
                    {
                        transferPenalty = options.TransferPenaltyMinutes;
                    }

                    double walkPenalty = (edge.DistanceMeters / 100d) * options.WalkPenaltyPer100Meters;
                    double tentativeG = gScore[current] + edge.TravelMinutes + walkPenalty + transferPenalty;

                    if (!gScore.TryGetValue(nextState, out double oldG) || tentativeG < oldG)
                    {
                        gScore[nextState] = tentativeG;
                        previous[nextState] = (current, edge);

                        double h = Heuristic(graph.Stops.Get(edge.ToStopId), targetStop);
                        double f = tentativeG + h;

                        minHeap.Enqueue(nextState, f);
                        heapInsertions++;
                    }
                }
            }

            if (bestEndState == null)
            {
                throw new InvalidOperationException("No route could be found between the selected stops.");
            }

            return BuildResult(previous, bestEndState, bestEndCost, nodesVisited, edgesExamined, heapInsertions);
        }

        private double Heuristic(Stop stopA, Stop stopB)
        {
            // Euclidean distance
            double dLat = stopA.Latitude - stopB.Latitude;
            double dLon = stopA.Longitude - stopB.Longitude;
            double distance = Math.Sqrt(dLat * dLat + dLon * dLon);

            // Admissible heuristic factor (0.015 ensures it never overestimates actual travel minutes)
            return distance * 0.015;
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
}
