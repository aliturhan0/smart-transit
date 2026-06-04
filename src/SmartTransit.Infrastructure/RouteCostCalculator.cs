using SmartTransit.Application;
using SmartTransit.Domain;

namespace SmartTransit.Infrastructure;

internal static class RouteCostCalculator
{
    private const double MinTransferPenalty = 500;

    public static double EdgeCost(
        TransitEdge edge,
        RouteOptions options,
        string? currentLineId)
    {
        var baseCost = options.Criterion switch
        {
            RouteCriterion.Distance => edge.DistanceMeters,
            _ => edge.TravelMinutes
        };

        var transferPenalty = 0d;
        if (currentLineId is not null && currentLineId != edge.LineId)
        {
            transferPenalty = options.Criterion == RouteCriterion.MinTransfers
                ? MinTransferPenalty + options.TransferPenaltyMinutes
                : options.TransferPenaltyMinutes;
        }

        var walkPenalty = (edge.DistanceMeters / 100d) * options.WalkPenaltyPer100Meters;
        return baseCost + transferPenalty + walkPenalty;
    }

    public static double WalkingCost(double distanceUnits, RouteOptions options)
    {
        if (distanceUnits <= 0) return 0;

        return options.Criterion switch
        {
            RouteCriterion.Distance => distanceUnits,
            RouteCriterion.MinTransfers => (distanceUnits / options.WalkSpeedUnitsPerMinute) * 0.5,
            _ => distanceUnits / options.WalkSpeedUnitsPerMinute
        };
    }

    public static double Heuristic(Stop from, Stop to, RouteOptions options)
    {
        var dx = from.Latitude - to.Latitude;
        var dy = from.Longitude - to.Longitude;
        var distance = Math.Sqrt(dx * dx + dy * dy);

        return options.Criterion switch
        {
            RouteCriterion.Distance => distance,
            _ => distance * 0.015
        };
    }
}
