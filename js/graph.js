/**
 * ============================================================
 *  Graf (Graph) - Multigraph Yapısı
 * ============================================================
 * 
 * Toplu taşıma ağını modellemek için kullanılır.
 *   - Düğümler (vertices): Duraklar
 *   - Kenarlar (edges): Duraklar arası bağlantılar
 *   - Kenar özellikleri: mesafe, süre, hat bilgisi
 * 
 * Multigraph Desteği:
 *   Aynı iki durak arasında birden fazla hat geçebilir.
 *   Örneğin: A-B arası hem M1 Metro hem B2 Otobüs geçebilir.
 * 
 * Temsil: Komşuluk Listesi (Adjacency List)
 *   - Her düğüm için komşularının listesi tutulur
 *   - HashTable kullanılarak hızlı erişim sağlanır
 * 
 * Zaman Karmaşıklığı:
 *   - Düğüm ekleme:    O(1)
 *   - Kenar ekleme:    O(1)
 *   - Komşuları bulma: O(1) ortalama + O(E_v) kenar sayısı
 *   - Kenar arama:     O(E) kenar sırası
 * 
 * Uzay Karmaşıklığı: O(V + E) - V: düğüm, E: kenar sayısı
 * ============================================================
 */

import { HashTable } from './hash-table.js';

export class Graph {
    constructor() {
        // Komşuluk listesi: durakId → [{ to, distance, duration, lineId, lineName }]
        this.adjacencyList = new HashTable(101);
        
        // Düğüm bilgileri: durakId → { id, name, x, y, ... }
        this.vertices = new HashTable(101);
        
        // Tüm kenarlar listesi (görselleştirme için)
        this.edges = [];
        
        // Düğüm ve kenar sayaçları
        this._vertexCount = 0;
        this._edgeCount = 0;
    }

    // --- Düğüm İşlemleri ---

    /**
     * Grafa yeni bir düğüm (durak) ekler
     * @param {string|number} id - Durak ID
     * @param {Object} data - Durak bilgileri { name, x, y, ... }
     * @complexity O(1) ortalama
     */
    addVertex(id, data = {}) {
        const vertexId = String(id);
        
        if (!this.vertices.has(vertexId)) {
            this.vertices.set(vertexId, { id: vertexId, ...data });
            this.adjacencyList.set(vertexId, []);
            this._vertexCount++;
        }
    }

    /**
     * Düğüm bilgisini döndürür
     * @param {string|number} id - Durak ID
     * @returns {Object|undefined} Durak bilgisi
     * @complexity O(1) ortalama
     */
    getVertex(id) {
        return this.vertices.get(String(id));
    }

    /**
     * Düğümün graflarda olup olmadığını kontrol eder
     * @complexity O(1) ortalama
     */
    hasVertex(id) {
        return this.vertices.has(String(id));
    }

    /**
     * Tüm düğümleri döndürür
     * @returns {Array} Düğüm bilgileri dizisi
     */
    getAllVertices() {
        return this.vertices.values();
    }

    // --- Kenar İşlemleri ---

    /**
     * İki düğüm arasına yönlü kenar ekler (tek yönlü)
     * Multigraph: Aynı düğüm çifti arasında birden fazla kenar olabilir
     * 
     * @param {string|number} from - Kaynak durak ID
     * @param {string|number} to - Hedef durak ID
     * @param {Object} properties - Kenar özellikleri
     *   - distance: Mesafe (metre)
     *   - duration: Süre (dakika)
     *   - lineId:   Hat ID
     *   - lineName: Hat adı
     *   - lineType: Hat tipi (metro/bus/tram)
     * @complexity O(1) ortalama
     */
    addDirectedEdge(from, to, properties = {}) {
        const fromId = String(from);
        const toId = String(to);

        // Düğümler yoksa ekle
        if (!this.adjacencyList.has(fromId)) {
            this.addVertex(fromId);
        }
        if (!this.adjacencyList.has(toId)) {
            this.addVertex(toId);
        }

        const edge = {
            from: fromId,
            to: toId,
            distance: properties.distance || 0,
            duration: properties.duration || 0,
            lineId: properties.lineId || '',
            lineName: properties.lineName || '',
            lineType: properties.lineType || 'bus',
            lineColor: properties.lineColor || '#888888'
        };

        // Komşuluk listesine ekle
        const neighbors = this.adjacencyList.get(fromId);
        neighbors.push(edge);
        
        // Kenar listesine ekle
        this.edges.push(edge);
        this._edgeCount++;
    }

    /**
     * İki düğüm arasına çift yönlü kenar ekler
     * Toplu taşımada her iki yönde de gidiş gelişin mümkün olduğu durumlar için
     * 
     * @complexity O(1) ortalama
     */
    addUndirectedEdge(from, to, properties = {}) {
        this.addDirectedEdge(from, to, properties);
        this.addDirectedEdge(to, from, properties);
    }

    /**
     * Bir düğümün tüm komşu kenarlarını döndürür
     * @param {string|number} id - Durak ID
     * @returns {Array} Kenar dizisi [{ to, distance, duration, lineId, ... }]
     * @complexity O(1) ortalama
     */
    getNeighbors(id) {
        const vertexId = String(id);
        return this.adjacencyList.get(vertexId) || [];
    }

    /**
     * İki düğüm arasındaki tüm kenarları döndürür (multigraph)
     * @returns {Array} Kenar dizisi
     */
    getEdgesBetween(from, to) {
        const fromId = String(from);
        const toId = String(to);
        const neighbors = this.adjacencyList.get(fromId) || [];
        return neighbors.filter(edge => edge.to === toId);
    }

    /**
     * Tüm kenarları döndürür
     */
    getAllEdges() {
        return this.edges;
    }

    /**
     * İki düğüm arasındaki en kısa kenarı döndürür (belirli kritere göre)
     * @param {string} criterion - 'distance' veya 'duration'
     */
    getBestEdge(from, to, criterion = 'distance') {
        const edges = this.getEdgesBetween(from, to);
        if (edges.length === 0) return null;
        
        return edges.reduce((best, edge) => 
            edge[criterion] < best[criterion] ? edge : best
        );
    }

    // --- İstatistikler ---

    /**
     * Düğüm sayısını döndürür
     */
    get vertexCount() {
        return this._vertexCount;
    }

    /**
     * Kenar sayısını döndürür
     */
    get edgeCount() {
        return this._edgeCount;
    }

    /**
     * Bir düğümün derecesini (bağlantı sayısını) döndürür
     */
    getDegree(id) {
        const neighbors = this.getNeighbors(id);
        return neighbors.length;
    }

    /**
     * Graf istatistiklerini döndürür (debug/analiz için)
     */
    getStats() {
        const vertices = this.getAllVertices();
        let totalDegree = 0;
        let maxDegree = 0;
        let minDegree = Infinity;

        for (const v of vertices) {
            const degree = this.getDegree(v.id);
            totalDegree += degree;
            maxDegree = Math.max(maxDegree, degree);
            minDegree = Math.min(minDegree, degree);
        }

        return {
            vertexCount: this._vertexCount,
            edgeCount: this._edgeCount,
            avgDegree: this._vertexCount > 0 
                ? (totalDegree / this._vertexCount).toFixed(2) 
                : 0,
            maxDegree,
            minDegree: minDegree === Infinity ? 0 : minDegree
        };
    }

    /**
     * Grafi string olarak gösterir (debug için)
     */
    toString() {
        let result = `Graf: ${this._vertexCount} düğüm, ${this._edgeCount} kenar\n`;
        
        for (const vertex of this.getAllVertices()) {
            const neighbors = this.getNeighbors(vertex.id);
            const neighborStr = neighbors
                .map(e => `${e.to}(${e.lineName})`)
                .join(', ');
            result += `  ${vertex.id} (${vertex.name}) → [${neighborStr}]\n`;
        }
        
        return result;
    }
}
