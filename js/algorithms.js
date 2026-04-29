/**
 * ============================================================
 *  Algoritmalar: KNN, Dijkstra, A*
 * ============================================================
 * 
 * Bu dosya, toplu taşıma sistemi için gerekli temel
 * algoritmaları içerir:
 * 
 * 1. KNN (K-Nearest Neighbors)
 *    - Spatial tree üzerinde en yakın K durağı bulur
 * 
 * 2. Dijkstra Algoritması
 *    - Graf üzerinde en düşük maliyetli rotayı hesaplar
 *    - Min-Heap (öncelik kuyruğu) kullanır
 * 
 * 3. A* Algoritması (opsiyonel iyileştirme)
 *    - Dijkstra + heuristik fonksiyon
 *    - Hedef noktaya olan tahmini mesafeyi kullanarak
 *      arama alanını daraltır
 * ============================================================
 */

import { MinHeap } from './min-heap.js';

/**
 * ============================================================
 * KNN - K En Yakın Komşu Araması
 * ============================================================
 * 
 * KD-Tree üzerinde çalışarak verilen noktaya en yakın
 * K durağı bulur.
 * 
 * @param {KdTree} kdTree - Durak koordinatlarını içeren KD-Tree
 * @param {Object} point - { x, y } hedef nokta
 * @param {number} k - Kaç komşu bulunacağı
 * @returns {Object} { results, stats }
 * 
 * Zaman Karmaşıklığı: O(K log N) ortalama
 * Uzay Karmaşıklığı: O(K + log N) (sonuç + özyineleme yığını)
 */
export function findNearestStops(kdTree, point, k = 5) {
    const startTime = performance.now();
    
    const results = kdTree.knn(point, k);
    
    const endTime = performance.now();
    
    return {
        results,
        stats: {
            algorithm: 'KNN (KD-Tree)',
            k,
            queryPoint: point,
            resultCount: results.length,
            executionTimeMs: (endTime - startTime).toFixed(3),
            treeHeight: kdTree.getHeight(),
            totalNodes: kdTree.nodeCount
        }
    };
}

/**
 * ============================================================
 * Dijkstra Algoritması - En Kısa Yol
 * ============================================================
 * 
 * Ağırlıklı graf üzerinde tek kaynaklı en kısa yol algoritması.
 * Min-Heap kullanarak en düşük maliyetli düğümü verimli şekilde seçer.
 * 
 * Algoritma Adımları:
 *   1. Başlangıç düğümü mesafesi = 0, diğerleri = ∞
 *   2. Min-Heap'ten en düşük maliyetli düğümü çıkar
 *   3. Komşularını kontrol et, daha kısa yol bulunursa güncelle
 *   4. Hedef düğüme ulaşana veya heap boşalana kadar tekrarla
 * 
 * Rota Maliyet Modeli:
 *   - Yürüyüş mesafesi (kullanıcı → durak)
 *   - Ulaşım maliyeti (duraklar arası)
 *   - Aktarma maliyeti (hat değişikliği)
 * 
 * @param {Graph} graph - Toplu taşıma grafı
 * @param {string} startId - Başlangıç durak ID
 * @param {string} endId - Hedef durak ID
 * @param {Object} options - Optimizasyon seçenekleri
 * @returns {Object} { path, totalCost, stats }
 * 
 * Zaman Karmaşıklığı: O((V + E) log V)
 *   - V: düğüm sayısı, E: kenar sayısı
 *   - Her düğüm heap'e bir kez eklenir: O(V log V)
 *   - Her kenar bir kez incelenir: O(E log V)
 * 
 * Uzay Karmaşıklığı: O(V)
 *   - Mesafe tablosu + önceki düğüm tablosu + heap
 */
export function dijkstra(graph, startId, endId, options = {}) {
    const startTime = performance.now();
    
    // Optimizasyon kriteri
    const criterion = options.criterion || 'duration'; // 'distance' | 'duration'
    const transferPenalty = options.transferPenalty !== undefined 
        ? options.transferPenalty : 3; // Aktarma cezası (dakika)
    
    // Mesafe/maliyet tablosu: düğüm → en düşük maliyet
    const dist = {};
    // Önceki düğüm tablosu: düğüm → { prevNode, edge }
    const prev = {};
    // Ziyaret edilen düğümler
    const visited = new Set();
    // Her düğüme hangi hatla geldiğimiz
    const arrivedByLine = {};
    
    // İstatistikler
    let nodesVisited = 0;
    let edgesExamined = 0;

    // Başlangıç değerleri
    const allVertices = graph.getAllVertices();
    for (const v of allVertices) {
        dist[v.id] = Infinity;
    }
    dist[startId] = 0;
    arrivedByLine[startId] = null;

    // Min-Heap: { cost, nodeId, lineId }
    const heap = new MinHeap((a, b) => a.cost - b.cost);
    heap.insert({ cost: 0, nodeId: startId, lineId: null });

    while (!heap.isEmpty()) {
        const { cost, nodeId, lineId } = heap.extractMin();

        // Zaten ziyaret edildiyse atla (lazy deletion)
        if (visited.has(nodeId)) continue;
        
        visited.add(nodeId);
        nodesVisited++;

        // Hedefe ulaştık mı?
        if (nodeId === endId) break;

        // Komşuları incele
        const neighbors = graph.getNeighbors(nodeId);
        
        for (const edge of neighbors) {
            edgesExamined++;
            
            if (visited.has(edge.to)) continue;

            // Kenar maliyetini hesapla
            let edgeCost;
            if (criterion === 'distance') {
                edgeCost = edge.distance;
            } else if (criterion === 'duration') {
                edgeCost = edge.duration;
            } else {
                edgeCost = edge.duration; // varsayılan
            }

            // Aktarma cezası: Hat değişiyorsa ek maliyet
            let penalty = 0;
            if (lineId !== null && edge.lineId !== lineId) {
                penalty = transferPenalty;
            }

            const newCost = cost + edgeCost + penalty;

            if (newCost < dist[edge.to]) {
                dist[edge.to] = newCost;
                prev[edge.to] = { prevNode: nodeId, edge };
                arrivedByLine[edge.to] = edge.lineId;

                heap.insert({ 
                    cost: newCost, 
                    nodeId: edge.to, 
                    lineId: edge.lineId 
                });
            }
        }
    }

    const endTime = performance.now();

    // Yolu yeniden oluştur (geri izleme / backtracking)
    const path = reconstructPath(prev, startId, endId, graph);

    return {
        path: path.stops,
        edges: path.edges,
        segments: path.segments,
        totalCost: dist[endId] === Infinity ? -1 : dist[endId],
        totalDistance: path.totalDistance,
        totalDuration: path.totalDuration,
        transfers: path.transfers,
        found: dist[endId] !== Infinity,
        stats: {
            algorithm: 'Dijkstra',
            criterion,
            transferPenalty,
            nodesVisited,
            edgesExamined,
            totalVertices: allVertices.length,
            executionTimeMs: (endTime - startTime).toFixed(3)
        }
    };
}

/**
 * ============================================================
 * A* Algoritması - Heuristik ile Geliştirilmiş En Kısa Yol
 * ============================================================
 * 
 * Dijkstra'nın genişletilmiş hali. Hedefe olan tahmini
 * mesafeyi (heuristik) kullanarak arama alanını daraltır.
 * 
 * f(n) = g(n) + h(n)
 *   - g(n): başlangıçtan n'ye olan gerçek maliyet
 *   - h(n): n'den hedefe olan tahmini maliyet (heuristik)
 *   - f(n): toplam tahmini maliyet
 * 
 * Heuristik: Öklid mesafesi / ortalama hız
 *   - Kabul edilebilir (admissible): Gerçek maliyeti asla aşmaz
 *   - Bu sayede A* optimal sonuç garanti eder
 * 
 * @param {Graph} graph - Toplu taşıma grafı
 * @param {string} startId - Başlangıç durak ID
 * @param {string} endId - Hedef durak ID
 * @param {Object} options - Seçenekler
 * @returns {Object} { path, totalCost, stats }
 * 
 * Zaman Karmaşıklığı: O((V + E) log V) - en kötü
 *   Pratikte Dijkstra'dan çok daha az düğüm ziyaret eder
 * 
 * Uzay Karmaşıklığı: O(V)
 */
 /**
 * ============================================================
 * A* Algoritması - İYİLEŞTİRİLMİŞ VERSİYON
 * ============================================================
 * Yapılan İyileştirmeler:
 * 1. Dinamik Başlatma (O(V) Maliyeti Kaldırıldı)
 * 2. Güvenlik Kontrolleri (Guard Clauses)
 * 3. Tie-Breaking Heuristic
 * 4. Optimize Edilmiş Closed Set (Ziyaret Edilenler)
 */
export function aStar(graph, startId, endId, options = {}) {
    const startTime = performance.now();

    const criterion = options.criterion || 'duration';
    const transferPenalty = options.transferPenalty !== undefined 
        ? options.transferPenalty : 3;

    // İYİLEŞTİRME 1: Güvenlik Kontrolü (Düğümler grafikte yoksa çökmeyi engelle)
    const startVertex = graph.getVertex(startId);
    const endVertex = graph.getVertex(endId);
    if (!startVertex || !endVertex) {
        console.warn("A* Hata: Başlangıç veya bitiş durağı bulunamadı.");
        return { found: false, path: [], stats: {} };
    }

    // İYİLEŞTİRME 2: Dinamik Başlatma (O(V) karmaşıklığı yaratan döngü kaldırıldı)
    // Değerleri sadece düğümleri keşfettikçe hafızaya alıyoruz.
    const gScore = {};
    const fScore = {};
    const prev = {};
    
    // İYİLEŞTİRME 4: Closed Set (Ziyaret edilen düğümleri takip ederek sonsuz döngüyü önler)
    const visited = new Set();
    const arrivedByLine = {};

    let nodesVisited = 0;
    let edgesExamined = 0;

    // Sadece başlangıç düğümünü başlat
    gScore[startId] = 0;
    fScore[startId] = heuristic(startVertex, endVertex, criterion);
    arrivedByLine[startId] = null;

    // Min-Heap: f değerine göre sıralı
    const heap = new MinHeap((a, b) => a.f - b.f);
    heap.insert({ f: fScore[startId], g: 0, nodeId: startId, lineId: null });

    while (!heap.isEmpty()) {
        const { g, nodeId, lineId } = heap.extractMin();

        // Eğer bu düğümü zaten en kısa yoldan ziyaret ettiysek (Closed Set) es geç
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        nodesVisited++;

        // Hedefe ulaştık
        if (nodeId === endId) break;

        const neighbors = graph.getNeighbors(nodeId);

        for (const edge of neighbors) {
            edgesExamined++;
            
            // Ziyaret edilmiş komşuları atla
            if (visited.has(edge.to)) continue;

            let edgeCost = criterion === 'distance' ? edge.distance : edge.duration;

            // Aktarma Cezası (Hat değişiyorsa ek maliyet)
            let penalty = 0;
            if (lineId !== null && edge.lineId !== lineId) {
                penalty = transferPenalty;
            }

            const tentativeG = g + edgeCost + penalty;

            // Dinamik Kontrol: Eğer düğüm henüz gScore tablosunda yoksa Infinity kabul et
            const currentGScore = gScore[edge.to] !== undefined ? gScore[edge.to] : Infinity;

            if (tentativeG < currentGScore) {
                gScore[edge.to] = tentativeG;
                
                // Heuristik hesapla ve f değerini güncelle
                const h = heuristic(graph.getVertex(edge.to), endVertex, criterion);
                fScore[edge.to] = tentativeG + h;
                
                prev[edge.to] = { prevNode: nodeId, edge };
                arrivedByLine[edge.to] = edge.lineId;

                heap.insert({
                    f: fScore[edge.to],
                    g: tentativeG,
                    nodeId: edge.to,
                    lineId: edge.lineId
                });
            }
        }
    }

    const endTime = performance.now();
    const allVerticesCount = graph.getAllVertices().length;
    
    // Yolu yeniden oluştur
    const path = reconstructPath(prev, startId, endId, graph);

    return {
        path: path.stops,
        edges: path.edges,
        segments: path.segments,
        totalCost: gScore[endId] === undefined ? -1 : gScore[endId],
        totalDistance: path.totalDistance,
        totalDuration: path.totalDuration,
        transfers: path.transfers,
        found: gScore[endId] !== undefined,
        stats: {
            algorithm: 'A* (Optimize Edilmiş)',
            criterion,
            transferPenalty,
            nodesVisited,
            edgesExamined,
            totalVertices: allVerticesCount,
            executionTimeMs: (endTime - startTime).toFixed(3)
        }
    };
}
/**
 * Heuristik Fonksiyon
 * Öklid mesafesi tabanlı tahmin
 * 
 * Kabul edilebilirlik (Admissibility):
 *   Heuristik, gerçek maliyeti asla aşmamalıdır.
 *   Öklid mesafesi her zaman gerçek yol mesafesinden
 *   küçük veya eşit olduğu için kabul edilebilirdir.
 */
 /**
 * Heuristik Fonksiyon - İYİLEŞTİRİLMİŞ (Tie-Breaking)
 */
function heuristic(vertexA, vertexB, criterion) {
    if (!vertexA || !vertexB) return 0;
    
    const dx = vertexA.x - vertexB.x;
    const dy = vertexA.y - vertexB.y;
    const euclidean = Math.sqrt(dx * dx + dy * dy);

    // İYİLEŞTİRME 3: Tie-Breaking (Eşitlik Bozucu)
    // Maliyetleri eşit olan alternatif yollar arasında, hedefe "kuş uçuşu" en düz gideni
    // tercih etmesini sağlamak için çok küçük bir oranla (1.001) çarpıyoruz.
    const tieBreaker = 1.001;

    if (criterion === 'distance') {
        return euclidean * 0.8 * tieBreaker; 
    } else {
        return euclidean * 0.02 * tieBreaker; 
    }
}
/**
 * Yol Yeniden Oluşturma (Path Reconstruction)
 * Geri izleme ile başlangıçtan hedefe olan yolu oluşturur
 * 
 * Ayrıca rota segmentlerini (hat bazlı bölümler) çıkarır:
 *   - Her segment bir hat üzerindeki ardışık durakları temsil eder
 *   - Aktarma noktaları belirlenir
 */
function reconstructPath(prev, startId, endId, graph) {
    const stops = [];
    const edges = [];
    const segments = []; // Hat bazlı segmentler
    
    let totalDistance = 0;
    let totalDuration = 0;
    let transfers = 0;

    // Geri izleme: hedeften başlangıca
    let current = endId;
    const reversedStops = [];
    const reversedEdges = [];

    while (current && prev[current]) {
        const { prevNode, edge } = prev[current];
        reversedStops.push(current);
        reversedEdges.push(edge);
        totalDistance += edge.distance;
        totalDuration += edge.duration;
        current = prevNode;
    }
    
    // Başlangıç düğümünü ekle
    if (current === startId) {
        reversedStops.push(startId);
    }

    // Sırayı düzelt
    for (let i = reversedStops.length - 1; i >= 0; i--) {
        stops.push(reversedStops[i]);
    }
    for (let i = reversedEdges.length - 1; i >= 0; i--) {
        edges.push(reversedEdges[i]);
    }

    // Segmentleri oluştur (hat bazlı gruplama)
    if (edges.length > 0) {
        let currentSegment = {
            lineId: edges[0].lineId,
            lineName: edges[0].lineName,
            lineColor: edges[0].lineColor,
            lineType: edges[0].lineType,
            stops: [stops[0]],
            edges: [edges[0]],
            distance: edges[0].distance,
            duration: edges[0].duration
        };

        for (let i = 1; i < edges.length; i++) {
            if (edges[i].lineId === currentSegment.lineId) {
                // Aynı hat, segmenti genişlet
                currentSegment.stops.push(stops[i]);
                currentSegment.edges.push(edges[i]);
                currentSegment.distance += edges[i].distance;
                currentSegment.duration += edges[i].duration;
            } else {
                // Hat değişimi = aktarma
                currentSegment.stops.push(stops[i]); // Aktarma durağı
                segments.push(currentSegment);
                transfers++;

                currentSegment = {
                    lineId: edges[i].lineId,
                    lineName: edges[i].lineName,
                    lineColor: edges[i].lineColor,
                    lineType: edges[i].lineType,
                    stops: [stops[i]],
                    edges: [edges[i]],
                    distance: edges[i].distance,
                    duration: edges[i].duration
                };
            }
        }
        // Son durağı ve segmenti ekle
        currentSegment.stops.push(stops[stops.length - 1]);
        segments.push(currentSegment);
    }

    return {
        stops,
        edges,
        segments,
        totalDistance,
        totalDuration,
        transfers
    };
}
