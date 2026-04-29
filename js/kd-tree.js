/**
 * ============================================================
 *  KD-Tree (K-Dimensional Tree) - 2 Boyutlu Uzay Ağacı
 * ============================================================
 * 
 * Durakların 2 boyutlu koordinatlarını indeksler.
 * Verilen bir noktaya en yakın K durağı verimli şekilde bulur.
 * 
 * Çalışma Prensibi:
 *   - Her seviyede bir eksen (x veya y) seçilir
 *   - Düğüm, o eksendeki medyan noktadır
 *   - Sol alt ağaç: daha küçük koordinatlı noktalar
 *   - Sağ alt ağaç: daha büyük koordinatlı noktalar
 * 
 * Zaman Karmaşıklığı:
 *   - Ağaç Oluşturma: O(N log N)        (sıralama + özyineleme)
 *   - En Yakın Komşu:  O(log N) ortalama, O(N) en kötü
 *   - KNN Sorgusu:     O(K log N) ortalama
 *   - Ekleme:          O(log N) ortalama
 * 
 * Uzay Karmaşıklığı: O(N)
 * ============================================================
 */

/**
 * KD-Tree düğüm sınıfı
 * Her düğüm bir noktayı, derinliğini ve çocuklarını tutar
 */
class KdTreeNode {
    constructor(point, depth = 0) {
        this.point = point;       // { x, y, id, name, ... }
        this.depth = depth;       // Ağaçtaki derinlik (eksen seçimi için)
        this.left = null;         // Sol çocuk (daha küçük değerler)
        this.right = null;        // Sağ çocuk (daha büyük değerler)
    }
}

export class KdTree {
    /**
     * KD-Tree oluşturucusu
     * @param {Array} points - { x, y, id, name, ... } nesnelerinin dizisi
     */
    constructor(points = []) {
        this.dimensions = 2;      // 2D: x ve y eksenleri
        this.nodeCount = 0;       // Toplam düğüm sayısı
        
        // Ağacı dengeli olarak inşa et
        this.root = this._buildBalanced([...points], 0);
    }

    // --- Ağaç İnşası ---

    /**
     * Dengeli KD-Tree inşa eder
     * 
     * Strateji:
     *   1. Mevcut eksene göre noktaları sırala
     *   2. Ortadaki noktayı (medyan) kök yap
     *   3. Sol yarıyı sol alt ağaca, sağ yarıyı sağ alt ağaca ver
     * 
     * @param {Array} points - Nokta dizisi
     * @param {number} depth - Mevcut derinlik
     * @returns {KdTreeNode|null}
     * @complexity O(N log N)
     */
    _buildBalanced(points, depth) {
        if (points.length === 0) return null;

        // Hangi eksende böleceğimizi belirle (derinlik mod 2)
        const axis = depth % this.dimensions;
        const key = axis === 0 ? 'x' : 'y';

        // O eksende sırala
        points.sort((a, b) => a[key] - b[key]);

        // Medyanı seç
        const medianIndex = Math.floor(points.length / 2);
        
        const node = new KdTreeNode(points[medianIndex], depth);
        this.nodeCount++;

        // Özyinelemeli olarak alt ağaçları oluştur
        node.left = this._buildBalanced(
            points.slice(0, medianIndex), 
            depth + 1
        );
        node.right = this._buildBalanced(
            points.slice(medianIndex + 1), 
            depth + 1
        );

        return node;
    }

    // --- Ekleme ---

    /**
     * Ağaca yeni bir nokta ekler
     * @param {Object} point - { x, y, id, name, ... }
     * @complexity O(log N) ortalama
     */
    insert(point) {
        this.root = this._insertNode(this.root, point, 0);
    }

    _insertNode(node, point, depth) {
        if (node === null) {
            this.nodeCount++;
            return new KdTreeNode(point, depth);
        }

        const axis = depth % this.dimensions;
        const key = axis === 0 ? 'x' : 'y';

        if (point[key] < node.point[key]) {
            node.left = this._insertNode(node.left, point, depth + 1);
        } else {
            node.right = this._insertNode(node.right, point, depth + 1);
        }

        return node;
    }

    // --- En Yakın Komşu (Nearest Neighbor) ---

    /**
     * Verilen noktaya en yakın durağı bulur
     * 
     * Algoritma:
     *   1. Hedef noktaya uygun dala in
     *   2. Yaprak düğümden geri dönerken mesafeyi kontrol et
     *   3. Diğer dalı kontrol etmemiz gerekip gerekmediğine karar ver
     *      (bölme düzlemine olan mesafe < en iyi mesafe ise kontrol et)
     * 
     * @param {Object} target - { x, y } hedef nokta
     * @returns {Object|null} En yakın nokta
     * @complexity O(log N) ortalama, O(N) en kötü
     */
    nearestNeighbor(target) {
        if (this.root === null) return null;

        const best = { point: null, distSq: Infinity };
        this._searchNearest(this.root, target, best);
        
        return best.point ? {
            ...best.point,
            distance: Math.sqrt(best.distSq)
        } : null;
    }

    _searchNearest(node, target, best) {
        if (node === null) return;

        // Mevcut düğüme olan mesafeyi hesapla
        const distSq = this._distanceSquared(node.point, target);
        
        if (distSq < best.distSq) {
            best.distSq = distSq;
            best.point = node.point;
        }

        // Hangi eksende böldüğümüzü belirle
        const axis = node.depth % this.dimensions;
        const key = axis === 0 ? 'x' : 'y';
        const diff = target[key] - node.point[key];

        // Hedef noktaya daha yakın olan dalı önce ara
        const first = diff < 0 ? node.left : node.right;
        const second = diff < 0 ? node.right : node.left;

        // Yakın dalı ara
        this._searchNearest(first, target, best);

        // Bölme düzlemine olan mesafe en iyi mesafeden küçükse
        // diğer dalı da kontrol et (budama / pruning)
        if (diff * diff < best.distSq) {
            this._searchNearest(second, target, best);
        }
    }

    // --- K En Yakın Komşu (KNN) ---

    /**
     * Verilen noktaya en yakın K durağı bulur
     * 
     * Algoritma:
     *   - Sınırlandırılmış sıralı liste (bounded sorted list) kullanır
     *   - K elemandan fazlası olduğunda en uzaktaki atılır
     *   - KD-Tree'nin budama (pruning) özelliği sayesinde
     *     gereksiz dallar atlanır
     * 
     * @param {Object} target - { x, y } hedef nokta
     * @param {number} k - Kaç komşu bulunacağı
     * @returns {Array} En yakın K nokta (mesafe bilgisiyle)
     * @complexity O(K log N) ortalama
     */
    knn(target, k) {
        if (this.root === null || k <= 0) return [];

        // Sonuçları mesafeye göre sıralı tutan liste
        // En uzak eleman sonda (max-heap yerine sıralı dizi)
        const results = [];
        
        this._knnSearch(this.root, target, k, results);

        // Mesafe bilgisiyle birlikte döndür
        return results.map(r => ({
            ...r.point,
            distance: Math.sqrt(r.distSq)
        }));
    }

    _knnSearch(node, target, k, results) {
        if (node === null) return;

        // Mevcut düğüme olan mesafe (karesi)
        const distSq = this._distanceSquared(node.point, target);

        // Listeye ekle veya güncelle
        if (results.length < k) {
            // Henüz K eleman toplanmadı, doğrudan ekle
            results.push({ point: node.point, distSq });
            // Mesafeye göre sırala (küçükten büyüğe)
            results.sort((a, b) => a.distSq - b.distSq);
        } else if (distSq < results[results.length - 1].distSq) {
            // Bu nokta, en uzak komşudan daha yakın
            results[results.length - 1] = { point: node.point, distSq };
            results.sort((a, b) => a.distSq - b.distSq);
        }

        // Hangi eksende böldüğümüzü belirle
        const axis = node.depth % this.dimensions;
        const key = axis === 0 ? 'x' : 'y';
        const diff = target[key] - node.point[key];

        // Hedef noktaya daha yakın olan dalı önce ara
        const first = diff < 0 ? node.left : node.right;
        const second = diff < 0 ? node.right : node.left;

        // Yakın dalı ara
        this._knnSearch(first, target, k, results);

        // Budama: Diğer dalı kontrol etmemiz gerekiyor mu?
        // En uzak komşuya olan mesafe > bölme düzlemine olan mesafe ise evet
        const maxDistSq = results.length < k 
            ? Infinity 
            : results[results.length - 1].distSq;

        if (diff * diff < maxDistSq) {
            this._knnSearch(second, target, k, results);
        }
    }

    // --- Yardımcı Fonksiyonlar ---

    /**
     * İki nokta arasındaki Öklid mesafesinin karesi
     * Kare kök hesaplamaktan kaçınarak performans kazanılır
     * (Karşılaştırma için mesafenin karesi yeterlidir)
     */
    _distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * İki nokta arasındaki Öklid mesafesi
     */
    _distance(a, b) {
        return Math.sqrt(this._distanceSquared(a, b));
    }

    /**
     * Ağaçtaki tüm noktaları döndürür (in-order traversal)
     */
    getAllPoints() {
        const points = [];
        this._inOrder(this.root, points);
        return points;
    }

    _inOrder(node, points) {
        if (node === null) return;
        this._inOrder(node.left, points);
        points.push(node.point);
        this._inOrder(node.right, points);
    }

    /**
     * Ağacın derinliğini döndürür
     */
    getHeight() {
        return this._height(this.root);
    }

    _height(node) {
        if (node === null) return 0;
        return 1 + Math.max(
            this._height(node.left), 
            this._height(node.right)
        );
    }

    /**
     * Ağaç istatistiklerini döndürür (debug/analiz için)
     */
    getStats() {
        return {
            nodeCount: this.nodeCount,
            height: this.getHeight(),
            balanceFactor: this.nodeCount > 0 
                ? (Math.log2(this.nodeCount + 1)).toFixed(2) + ' (ideal)'
                : '0',
            actualHeight: this.getHeight()
        };
    }
}
