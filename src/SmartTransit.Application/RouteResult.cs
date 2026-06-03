namespace SmartTransit.Application;

public sealed class RouteResult
{
    public required IReadOnlyList<int> PathStopIds { get; init; }
    public required IReadOnlyList<RouteStep> Steps { get; init; }
    public required double TotalMinutes { get; init; }
    public required double TotalCost { get; init; }

    /// <summary>Gerçek ziyaret edilen düğüm sayısı (algoritma istatistiği)</summary>
    public int NodesVisited { get; init; }

    /// <summary>Gerçek incelenen kenar sayısı (algoritma istatistiği)</summary>
    public int EdgesExamined { get; init; }

    /// <summary>Priority queue'ya eklenen toplam eleman sayısı</summary>
    public int HeapInsertions { get; init; }
}
