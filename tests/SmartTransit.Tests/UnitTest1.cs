using SmartTransit.Application;
using SmartTransit.Domain;
using SmartTransit.Infrastructure;

namespace SmartTransit.Tests;

public class RoutePlannerTests
{
    [Fact]
    public void FindsShortestRouteByCost()
    {
        var graph = new TransitGraph();
        graph.AddStop(new Stop(1, "A", 0, 0));
        graph.AddStop(new Stop(2, "B", 0, 0));
        graph.AddStop(new Stop(3, "C", 0, 0));
        graph.AddStop(new Stop(4, "D", 0, 0));

        graph.AddEdge(new TransitEdge(1, 2, "L1", 5, 100));
        graph.AddEdge(new TransitEdge(2, 4, "L1", 6, 100));
        graph.AddEdge(new TransitEdge(1, 3, "L2", 4, 200));
        graph.AddEdge(new TransitEdge(3, 4, "L3", 4, 200));

        var planner = new DijkstraRoutePlanner();
        var result = planner.FindShortestPath(graph, new RouteRequest(1, 4, new RouteOptions
        {
            TransferPenaltyMinutes = 8,
            WalkPenaltyPer100Meters = 1
        }));

        Assert.Equal([1, 2, 4], result.PathStopIds);
        Assert.Equal(11, result.TotalMinutes);
        Assert.True(result.TotalCost < 20);
    }
}
