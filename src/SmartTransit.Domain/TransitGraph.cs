namespace SmartTransit.Domain;

public sealed class TransitGraph
{
    private readonly HashTable<int, Stop> _stops = new();
    private readonly HashTable<int, List<TransitEdge>> _adjacency = new();

    public HashTable<int, Stop> Stops => _stops;
    public HashTable<int, List<TransitEdge>> Adjacency => _adjacency;

    public void AddStop(Stop stop)
    {
        _stops.Set(stop.Id, stop);
        if (!_adjacency.ContainsKey(stop.Id))
        {
            _adjacency.Set(stop.Id, new List<TransitEdge>());
        }
    }

    public void AddEdge(TransitEdge edge)
    {
        if (!_stops.ContainsKey(edge.FromStopId) || !_stops.ContainsKey(edge.ToStopId))
        {
            throw new InvalidOperationException("Both edge stops must be added before adding edges.");
        }

        _adjacency.Get(edge.FromStopId).Add(edge);
    }
}

