namespace SmartTransit.Application;

public sealed class RouteOptions
{
    public RouteCriterion Criterion { get; init; } = RouteCriterion.Duration;
    public double TransferPenaltyMinutes { get; init; } = 8;
    public double WalkPenaltyPer100Meters { get; init; } = 1.5;
    public double WalkSpeedUnitsPerMinute { get; init; } = 80;
    public double StartWalkDistance { get; init; }
    public double EndWalkDistance { get; init; }
}
