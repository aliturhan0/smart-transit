namespace SmartTransit.Application;

public sealed record RouteStep(int FromStopId, int ToStopId, string LineId, double TravelMinutes, double DistanceMeters);
