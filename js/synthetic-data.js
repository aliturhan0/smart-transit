/**
 * ============================================================
 *  Veri Yükleyici Yardımcı Fonksiyon
 * ============================================================
 * 
 * C# backend API'den gelen verileri frontend üzerindeki local 
 * veri yapılarına (Graf, KD-Tree, HashTable) yükler.
 * ============================================================
 */

/**
 * Şehir verisini local arama yapısı ve graf yapılarına yükler
 */
export function loadDataIntoStructures(cityData, graph, kdTree, stopTable, lineTable) {
    const { stops, lines, edges } = cityData;

    // Durakları grafa ve hash tablosuna ekle
    for (const stop of stops) {
        graph.addVertex(stop.id, {
            name: stop.name,
            x: stop.x,
            y: stop.y
        });
        stopTable.set(stop.id, stop);
    }

    // Kenarları grafa ekle (çift yönlü)
    for (const edge of edges) {
        graph.addUndirectedEdge(edge.from, edge.to, {
            distance: edge.distance,
            duration: edge.duration,
            lineId: edge.lineId,
            lineName: edge.lineName,
            lineType: edge.lineType,
            lineColor: edge.lineColor
        });
    }

    // Hat bilgilerini hash tablosuna ekle
    for (const line of lines) {
        lineTable.set(line.id, {
            ...line,
            stopNames: line.stops.map(sid => {
                const s = stops.find(st => st.id === sid);
                return s ? s.name : sid;
            })
        });
    }
}
