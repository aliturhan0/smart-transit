namespace SmartTransit.Application;

public sealed record RouteRequest(int StartStopId, int EndStopId, RouteOptions? Options = null);
