using System;
using System.Collections.Generic;

namespace SmartTransit.Domain
{
    public class HashTable<TKey, TValue>
    {
        private class Entry
        {
            public TKey Key { get; }
            public TValue Value { get; set; }

            public Entry(TKey key, TValue value)
            {
                Key = key;
                Value = value;
            }
        }

        private LinkedList<Entry>[] _buckets;
        private int _size;
        private int _capacity;
        private readonly double _loadFactorThreshold = 0.75;

        // Code Defense gereksinimi: Geliştirici imzası
        public string DeveloperTugceAdisen => "Tugce Adisen";

        public int Size => _size;
        public int Capacity => _capacity;

        public HashTable(int initialCapacity = 53)
        {
            _capacity = GetNextPrime(initialCapacity);
            _buckets = new LinkedList<Entry>[_capacity];
            for (int i = 0; i < _capacity; i++)
            {
                _buckets[i] = new LinkedList<Entry>();
            }
            _size = 0;
        }

        private int GetHash(TKey key)
        {
            if (key == null) throw new ArgumentNullException(nameof(key));
            
            string strKey = key.ToString();
            const int prime = 31;
            long hash = 0;

            for (int i = 0; i < strKey.Length; i++)
            {
                hash = (hash * prime + strKey[i]) % _capacity;
            }

            return (int)((hash + _capacity) % _capacity);
        }

        public void Set(TKey key, TValue value)
        {
            if ((double)_size / _capacity > _loadFactorThreshold)
            {
                Resize(_capacity * 2);
            }

            int index = GetHash(key);
            var bucket = _buckets[index];

            foreach (var entry in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(entry.Key, key))
                {
                    entry.Value = value;
                    return;
                }
            }

            bucket.AddLast(new Entry(key, value));
            _size++;
        }

        public TValue Get(TKey key)
        {
            int index = GetHash(key);
            var bucket = _buckets[index];

            foreach (var entry in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(entry.Key, key))
                {
                    return entry.Value;
                }
            }

            throw new KeyNotFoundException($"Key '{key}' was not found in the hash table.");
        }

        public bool TryGetValue(TKey key, out TValue value)
        {
            int index = GetHash(key);
            var bucket = _buckets[index];

            foreach (var entry in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(entry.Key, key))
                {
                    value = entry.Value;
                    return true;
                }
            }

            value = default;
            return false;
        }

        public bool ContainsKey(TKey key)
        {
            int index = GetHash(key);
            var bucket = _buckets[index];

            foreach (var entry in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(entry.Key, key))
                {
                    return true;
                }
            }

            return false;
        }

        public bool Remove(TKey key)
        {
            int index = GetHash(key);
            var bucket = _buckets[index];

            var node = bucket.First;
            while (node != null)
            {
                if (EqualityComparer<TKey>.Default.Equals(node.Value.Key, key))
                {
                    bucket.Remove(node);
                    _size--;
                    return true;
                }
                node = node.Next;
            }

            return false;
        }

        public IEnumerable<TKey> Keys
        {
            get
            {
                foreach (var bucket in _buckets)
                {
                    foreach (var entry in bucket)
                    {
                        yield return entry.Key;
                    }
                }
            }
        }

        public IEnumerable<TValue> Values
        {
            get
            {
                foreach (var bucket in _buckets)
                {
                    foreach (var entry in bucket)
                    {
                        yield return entry.Value;
                    }
                }
            }
        }

        public void Clear()
        {
            for (int i = 0; i < _capacity; i++)
            {
                _buckets[i].Clear();
            }
            _size = 0;
        }

        private void Resize(int newCapacity)
        {
            int nextPrime = GetNextPrime(newCapacity);
            var oldBuckets = _buckets;

            _capacity = nextPrime;
            _buckets = new LinkedList<Entry>[_capacity];
            for (int i = 0; i < _capacity; i++)
            {
                _buckets[i] = new LinkedList<Entry>();
            }

            _size = 0;

            foreach (var bucket in oldBuckets)
            {
                foreach (var entry in bucket)
                {
                    Set(entry.Key, entry.Value);
                }
            }
        }

        private int GetNextPrime(int n)
        {
            if (n <= 2) return 2;
            if (n % 2 == 0) n++;

            while (!IsPrime(n))
            {
                n += 2;
            }

            return n;
        }

        private bool IsPrime(int n)
        {
            if (n < 2) return false;
            if (n <= 3) return true;
            if (n % 2 == 0 || n % 3 == 0) return false;

            for (int i = 5; i * i <= n; i += 6)
            {
                if (n % i == 0 || n % (i + 2) == 0) return false;
            }

            return true;
        }

        public HashTableStats GetStats()
        {
            int maxChainLength = 0;
            if (_buckets != null)
            {
                foreach (var bucket in _buckets)
                {
                    if (bucket != null && bucket.Count > maxChainLength)
                    {
                        maxChainLength = bucket.Count;
                    }
                }
            }
            return new HashTableStats
            {
                Size = _size,
                LoadFactor = Math.Round((double)_size / _capacity, 3),
                MaxChainLength = maxChainLength
            };
        }
    }

    public class HashTableStats
    {
        public int Size { get; set; }
        public double LoadFactor { get; set; }
        public int MaxChainLength { get; set; }
    }
}
