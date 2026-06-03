namespace SmartTransit.Application;

public sealed class RouteResult
{
    public required IReadOnlyList<int> PathStopIds { get; init; }
    public required IReadOnlyList<RouteStep> Steps { get; init; }
    public required double TotalMinutes { get; init; }
    public required double TotalCost { get; init; }
}
