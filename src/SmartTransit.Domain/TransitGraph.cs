namespace SmartTransit.Domain;

public sealed class TransitGraph
{
    private readonly Dictionary<int, Stop> _stops = new();
    private readonly Dictionary<int, List<TransitEdge>> _adjacency = new();

    public IReadOnlyDictionary<int, Stop> Stops => _stops;
    public IReadOnlyDictionary<int, List<TransitEdge>> Adjacency => _adjacency;

    public void AddStop(Stop stop)
    {
        _stops[stop.Id] = stop;
        _adjacency.TryAdd(stop.Id, []);
    }

    public void AddEdge(TransitEdge edge)
    {
        if (!_stops.ContainsKey(edge.FromStopId) || !_stops.ContainsKey(edge.ToStopId))
        {
            throw new InvalidOperationException("Both edge stops must be added before adding edges.");
        }

        _adjacency[edge.FromStopId].Add(edge);
    }
}
