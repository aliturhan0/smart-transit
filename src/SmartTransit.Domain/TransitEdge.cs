namespace SmartTransit.Domain;

public sealed record TransitEdge(
    int FromStopId,
    int ToStopId,
    string LineId,
    double TravelMinutes,
    double DistanceMeters);
