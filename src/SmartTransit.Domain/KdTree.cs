using System;
using System.Collections.Generic;
using System.Linq;

namespace SmartTransit.Domain
{
    public class KdTreeNode
    {
        public Stop Point { get; }
        public int Depth { get; }
        public KdTreeNode Left { get; set; }
        public KdTreeNode Right { get; set; }

        public KdTreeNode(Stop point, int depth)
        {
            Point = point;
            Depth = depth;
        }
    }

    public class KdTree
    {
        private const int Dimensions = 2;
        private KdTreeNode _root;
        private int _nodeCount;

        // Code Defense gereksinimi: Geliştirici imzası
        public string DeveloperAliTurhan => "Ali Turhan";

        public KdTreeNode Root => _root;
        public int NodeCount => _nodeCount;

        public KdTree(IEnumerable<Stop> points)
        {
            var pointsList = points.ToList();
            _root = BuildBalanced(pointsList, 0);
        }

        private KdTreeNode BuildBalanced(List<Stop> points, int depth)
        {
            if (points.Count == 0) return null;

            int axis = depth % Dimensions;

            if (axis == 0)
            {
                points.Sort((a, b) => a.Latitude.CompareTo(b.Latitude));
            }
            else
            {
                points.Sort((a, b) => a.Longitude.CompareTo(b.Longitude));
            }

            int medianIndex = points.Count / 2;
            var node = new KdTreeNode(points[medianIndex], depth);
            _nodeCount++;

            node.Left = BuildBalanced(points.GetRange(0, medianIndex), depth + 1);
            node.Right = BuildBalanced(points.GetRange(medianIndex + 1, points.Count - (medianIndex + 1)), depth + 1);

            return node;
        }

        public void Insert(Stop point)
        {
            _root = InsertNode(_root, point, 0);
        }

        private KdTreeNode InsertNode(KdTreeNode node, Stop point, int depth)
        {
            if (node == null)
            {
                _nodeCount++;
                return new KdTreeNode(point, depth);
            }

            int axis = depth % Dimensions;
            double nodeCoord = axis == 0 ? node.Point.Latitude : node.Point.Longitude;
            double pointCoord = axis == 0 ? point.Latitude : point.Longitude;

            if (pointCoord < nodeCoord)
            {
                node.Left = InsertNode(node.Left, point, depth + 1);
            }
            else
            {
                node.Right = InsertNode(node.Right, point, depth + 1);
            }

            return node;
        }

        public List<KnnResult> Knn(double targetLat, double targetLon, int k)
        {
            if (_root == null || k <= 0) return new List<KnnResult>();

            var results = new List<KnnResult>();
            KnnSearch(_root, targetLat, targetLon, k, results);

            return results;
        }

        private void KnnSearch(KdTreeNode node, double targetLat, double targetLon, int k, List<KnnResult> results)
        {
            if (node == null) return;

            double distSq = DistanceSquared(node.Point.Latitude, node.Point.Longitude, targetLat, targetLon);

            // Insert or update
            if (results.Count < k)
            {
                results.Add(new KnnResult(node.Point, distSq));
                results.Sort((a, b) => a.DistanceSq.CompareTo(b.DistanceSq));
            }
            else if (distSq < results[results.Count - 1].DistanceSq)
            {
                results[results.Count - 1] = new KnnResult(node.Point, distSq);
                results.Sort((a, b) => a.DistanceSq.CompareTo(b.DistanceSq));
            }

            int axis = node.Depth % Dimensions;
            double nodeVal = axis == 0 ? node.Point.Latitude : node.Point.Longitude;
            double targetVal = axis == 0 ? targetLat : targetLon;
            double diff = targetVal - nodeVal;

            var first = diff < 0 ? node.Left : node.Right;
            var second = diff < 0 ? node.Right : node.Left;

            KnnSearch(first, targetLat, targetLon, k, results);

            double maxDistSq = results.Count < k ? double.PositiveInfinity : results[results.Count - 1].DistanceSq;

            if (diff * diff < maxDistSq)
            {
                KnnSearch(second, targetLat, targetLon, k, results);
            }
        }

        public int GetHeight()
        {
            return CalculateHeight(_root);
        }

        private int CalculateHeight(KdTreeNode node)
        {
            if (node == null) return 0;
            return 1 + Math.Max(CalculateHeight(node.Left), CalculateHeight(node.Right));
        }

        private double DistanceSquared(double lat1, double lon1, double lat2, double lon2)
        {
            double dLat = lat1 - lat2;
            double dLon = lon1 - lon2;
            return dLat * dLat + dLon * dLon;
        }
    }

    public class KnnResult
    {
        public Stop Point { get; }
        public double DistanceSq { get; }
        public double Distance => Math.Sqrt(DistanceSq);

        public KnnResult(Stop point, double distanceSq)
        {
            Point = point;
            DistanceSq = distanceSq;
        }
    }
}
