namespace SmartTransit.Domain;

/// <summary>
/// Binary min-heap priority queue. Push/Pop are O(log n).
/// </summary>
public sealed class MinHeap<T> where T : notnull
{
    private readonly List<(T Item, double Priority)> _heap = new();
    private int _pushCount;

    public int Count => _heap.Count;
    public int PushCount => _pushCount;

    public void Push(T item, double priority)
    {
        _heap.Add((item, priority));
        _pushCount++;
        SiftUp(_heap.Count - 1);
    }

    public bool TryPop(out T item, out double priority)
    {
        if (_heap.Count == 0)
        {
            item = default!;
            priority = 0;
            return false;
        }

        var root = _heap[0];
        item = root.Item;
        priority = root.Priority;

        var last = _heap[^1];
        _heap.RemoveAt(_heap.Count - 1);

        if (_heap.Count > 0)
        {
            _heap[0] = last;
            SiftDown(0);
        }

        return true;
    }

    private void SiftUp(int index)
    {
        while (index > 0)
        {
            int parent = (index - 1) / 2;
            if (_heap[index].Priority >= _heap[parent].Priority) break;
            Swap(index, parent);
            index = parent;
        }
    }

    private void SiftDown(int index)
    {
        int last = _heap.Count - 1;
        while (true)
        {
            int left = index * 2 + 1;
            int right = index * 2 + 2;
            int smallest = index;
            if (left <= last && _heap[left].Priority < _heap[smallest].Priority) smallest = left;
            if (right <= last && _heap[right].Priority < _heap[smallest].Priority) smallest = right;
            if (smallest == index) break;
            Swap(index, smallest);
            index = smallest;
        }
    }

    private void Swap(int a, int b) => (_heap[a], _heap[b]) = (_heap[b], _heap[a]);
}
