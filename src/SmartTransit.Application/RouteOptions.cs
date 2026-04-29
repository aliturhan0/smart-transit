namespace SmartTransit.Application;

public sealed class RouteOptions
{
    public double TransferPenaltyMinutes { get; init; } = 8;
    public double WalkPenaltyPer100Meters { get; init; } = 1.5;
}
