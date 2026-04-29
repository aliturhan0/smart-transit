using SmartTransit.Domain;

namespace SmartTransit.Application;

public interface IRoutePlanner
{
    RouteResult FindShortestPath(TransitGraph graph, RouteRequest request);
}
