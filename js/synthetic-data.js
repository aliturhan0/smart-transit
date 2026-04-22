/**
 * ============================================================
 *  Sentetik Veri Üretici
 * ============================================================
 * 
 * Test amaçlı şehir verisi oluşturur:
 *   - Duraklar (koordinatları ile)
 *   - Toplu taşıma hatları (metro, tramvay, otobüs)
 *   - Duraklar arası bağlantılar (mesafe, süre, hat bilgisi)
 * 
 * Amaç:
 *   - Farklı şehir ağlarını test etmek
 *   - Algoritma performansını değerlendirmek
 * ============================================================
 */

/**
 * Şehir verisi oluşturur
 * Koordinat alanı: 0 - MAP_WIDTH x 0 - MAP_HEIGHT
 * 
 * @returns {Object} { stops, lines, lineColors }
 */
export function generateCityData() {
    const MAP_WIDTH = 1000;
    const MAP_HEIGHT = 700;

    // ============================================================
    // DURAKLAR
    // ============================================================
    const stops = [
        // --- Merkez Bölgesi ---
        { id: 'S01', name: 'Cumhuriyet Meydanı', x: 500, y: 350 },
        { id: 'S02', name: 'Belediye', x: 460, y: 320 },
        { id: 'S03', name: 'Adliye', x: 540, y: 310 },
        { id: 'S04', name: 'Çarşı', x: 480, y: 380 },
        { id: 'S05', name: 'Kültür Merkezi', x: 530, y: 390 },
        
        // --- Kuzey Bölgesi ---
        { id: 'S06', name: 'Üniversite', x: 420, y: 150 },
        { id: 'S07', name: 'Kampüs', x: 380, y: 120 },
        { id: 'S08', name: 'Teknoloji Vadisi', x: 460, y: 180 },
        { id: 'S09', name: 'Araştırma Merkezi', x: 500, y: 140 },
        { id: 'S10', name: 'Yurt', x: 350, y: 160 },
        
        // --- Güney Bölgesi ---
        { id: 'S11', name: 'Sanayi', x: 450, y: 560 },
        { id: 'S12', name: 'Organize Sanayi', x: 500, y: 590 },
        { id: 'S13', name: 'Lojistik Merkez', x: 550, y: 570 },
        { id: 'S14', name: 'Fabrikalar', x: 420, y: 600 },
        { id: 'S15', name: 'Depo', x: 480, y: 620 },
        
        // --- Doğu Bölgesi ---
        { id: 'S16', name: 'Hastane', x: 700, y: 340 },
        { id: 'S17', name: 'Poliklinik', x: 740, y: 300 },
        { id: 'S18', name: 'Eczane Caddesi', x: 680, y: 370 },
        { id: 'S19', name: 'Tıp Fakültesi', x: 760, y: 360 },
        { id: 'S20', name: 'Acil', x: 720, y: 380 },
        
        // --- Batı Bölgesi ---
        { id: 'S21', name: 'Terminal', x: 250, y: 350 },
        { id: 'S22', name: 'Otogar', x: 200, y: 330 },
        { id: 'S23', name: 'Park', x: 280, y: 380 },
        { id: 'S24', name: 'Yeşil Alan', x: 230, y: 400 },
        { id: 'S25', name: 'Spor Kompleksi', x: 300, y: 310 },
        
        // --- Kuzeydoğu ---
        { id: 'S26', name: 'AVM', x: 650, y: 180 },
        { id: 'S27', name: 'Sinema', x: 680, y: 210 },
        { id: 'S28', name: 'Fuar Alanı', x: 620, y: 150 },
        { id: 'S29', name: 'Kongre Merkezi', x: 700, y: 160 },
        { id: 'S30', name: 'Otel Bölgesi', x: 660, y: 130 },
        
        // --- Kuzeybatı ---
        { id: 'S31', name: 'Havalimanı', x: 150, y: 120 },
        { id: 'S32', name: 'Kargo', x: 180, y: 150 },
        { id: 'S33', name: 'Uçak Bakım', x: 120, y: 100 },
        { id: 'S34', name: 'Terminal 2', x: 190, y: 180 },
        { id: 'S35', name: 'Otopark', x: 220, y: 140 },
        
        // --- Güneydoğu ---
        { id: 'S36', name: 'Stadyum', x: 700, y: 520 },
        { id: 'S37', name: 'Spor Salonu', x: 730, y: 490 },
        { id: 'S38', name: 'Olimpik Havuz', x: 680, y: 550 },
        { id: 'S39', name: 'Atletizm Pisti', x: 750, y: 540 },
        { id: 'S40', name: 'Tribün', x: 720, y: 560 },
        
        // --- Güneybatı ---
        { id: 'S41', name: 'Konut Bölgesi', x: 250, y: 520 },
        { id: 'S42', name: 'Site', x: 220, y: 550 },
        { id: 'S43', name: 'Okul', x: 280, y: 490 },
        { id: 'S44', name: 'Kreş', x: 200, y: 500 },
        { id: 'S45', name: 'Mahalle Parkı', x: 260, y: 560 },
        
        // --- Ara Noktalar (Ağı bağlayan duraklar) ---
        { id: 'S46', name: 'Köprü', x: 400, y: 280 },
        { id: 'S47', name: 'Kavşak', x: 580, y: 280 },
        { id: 'S48', name: 'Ring Durağı', x: 600, y: 420 },
        { id: 'S49', name: 'Meydan', x: 380, y: 420 },
        { id: 'S50', name: 'Bulvar', x: 350, y: 280 },
        
        // --- Ek Duraklar ---
        { id: 'S51', name: 'Pazar Yeri', x: 440, y: 440 },
        { id: 'S52', name: 'Cami', x: 520, y: 440 },
        { id: 'S53', name: 'Müze', x: 560, y: 250 },
        { id: 'S54', name: 'Kütüphane', x: 440, y: 250 },
        { id: 'S55', name: 'Postane', x: 600, y: 350 },
        { id: 'S56', name: 'İtfaiye', x: 340, y: 450 },
        { id: 'S57', name: 'Emniyet', x: 620, y: 470 },
        { id: 'S58', name: 'Kaymakamlık', x: 480, y: 300 },
        { id: 'S59', name: 'Valilik', x: 520, y: 340 },
        { id: 'S60', name: 'Hükümet Konağı', x: 500, y: 280 },
        
        // --- Çevre Durakları ---
        { id: 'S61', name: 'Mezarlık', x: 850, y: 250 },
        { id: 'S62', name: 'Su Arıtma', x: 100, y: 400 },
        { id: 'S63', name: 'Enerji Santrali', x: 870, y: 450 },
        { id: 'S64', name: 'Baraj', x: 900, y: 200 },
        { id: 'S65', name: 'Orman Girişi', x: 130, y: 250 },
        { id: 'S66', name: 'Piknik Alanı', x: 160, y: 300 },
        { id: 'S67', name: 'Göl Kenarı', x: 880, y: 350 },
        { id: 'S68', name: 'Çiftlik', x: 900, y: 550 },
        { id: 'S69', name: 'Bağ Evi', x: 100, y: 550 },
        { id: 'S70', name: 'Sahil', x: 500, y: 670 },
        
        // --- Son Ek Duraklar ---
        { id: 'S71', name: 'Tren Garı', x: 400, y: 350 },
        { id: 'S72', name: 'Metro İstasyonu', x: 320, y: 340 },
        { id: 'S73', name: 'Aktarma Merkezi', x: 560, y: 350 },
        { id: 'S74', name: 'İş Merkezi', x: 640, y: 300 },
        { id: 'S75', name: 'Plaza', x: 660, y: 260 },
        { id: 'S76', name: 'Rezidans', x: 300, y: 430 },
        { id: 'S77', name: 'Lise', x: 350, y: 500 },
        { id: 'S78', name: 'İlkokul', x: 620, y: 530 },
        { id: 'S79', name: 'Cezaevi', x: 850, y: 150 },
        { id: 'S80', name: 'Askeri Bölge', x: 130, y: 500 },
    ];

    // ============================================================
    // HATLAR
    // ============================================================
    const lines = [
        // M1 Metro - Doğu-Batı ana hat
        {
            id: 'M1',
            name: 'M1 Metro',
            type: 'metro',
            color: '#3b82f6',       // Mavi
            speedFactor: 0.8,       // Hızlı (düşük süre)
            stops: ['S22', 'S21', 'S72', 'S71', 'S02', 'S01', 'S59', 'S73', 'S55', 'S16', 'S17', 'S19']
        },
        
        // M2 Metro - Kuzey-Güney hat  
        {
            id: 'M2',
            name: 'M2 Metro',
            type: 'metro',
            color: '#8b5cf6',       // Mor
            speedFactor: 0.8,
            stops: ['S09', 'S08', 'S60', 'S58', 'S01', 'S05', 'S52', 'S48', 'S57', 'S36', 'S38']
        },
        
        // T1 Tramvay - Çapraz hat
        {
            id: 'T1',
            name: 'T1 Tramvay',
            type: 'tram',
            color: '#f59e0b',       // Turuncu/Amber
            speedFactor: 1.0,
            stops: ['S31', 'S32', 'S35', 'S50', 'S46', 'S54', 'S58', 'S03', 'S47', 'S53', 'S75', 'S26', 'S29']
        },
        
        // B1 Otobüs - Kuzey ring
        {
            id: 'B1',
            name: 'B1 Otobüs',
            type: 'bus',
            color: '#10b981',       // Yeşil
            speedFactor: 1.3,       // Yavaş
            stops: ['S07', 'S10', 'S06', 'S08', 'S54', 'S46', 'S02', 'S01', 'S03', 'S47', 'S74', 'S27', 'S26', 'S28']
        },
        
        // B2 Otobüs - Güney hat
        {
            id: 'B2',
            name: 'B2 Otobüs',
            type: 'bus',
            color: '#06b6d4',       // Camgöbeği
            speedFactor: 1.3,
            stops: ['S01', 'S04', 'S51', 'S49', 'S56', 'S76', 'S43', 'S41', 'S42', 'S45']
        },
        
        // B3 Otobüs - Güneydoğu hat
        {
            id: 'B3',
            name: 'B3 Otobüs',
            type: 'bus',
            color: '#ec4899',       // Pembe
            speedFactor: 1.3,
            stops: ['S01', 'S05', 'S52', 'S48', 'S18', 'S20', 'S57', 'S78', 'S38', 'S40', 'S39']
        },
        
        // B4 Otobüs - Batı-Güney hat
        {
            id: 'B4',
            name: 'B4 Otobüs',
            type: 'bus',
            color: '#f97316',       // Turuncu
            speedFactor: 1.3,
            stops: ['S65', 'S66', 'S22', 'S24', 'S23', 'S21', 'S25', 'S50', 'S72', 'S71', 'S04', 'S51', 'S11', 'S14', 'S15']
        },
        
        // B5 Otobüs - Doğu çevre hat
        {
            id: 'B5',
            name: 'B5 Otobüs',
            type: 'bus',
            color: '#84cc16',       // Lime
            speedFactor: 1.3,
            stops: ['S29', 'S30', 'S79', 'S64', 'S61', 'S67', 'S19', 'S16', 'S18', 'S48', 'S57', 'S36', 'S37', 'S39', 'S68']
        },
        
        // B6 Otobüs - Sanayi hattı
        {
            id: 'B6',
            name: 'B6 Otobüs',
            type: 'bus',
            color: '#a855f7',       // Mor
            speedFactor: 1.3,
            stops: ['S71', 'S01', 'S59', 'S73', 'S55', 'S48', 'S13', 'S12', 'S11', 'S15', 'S70']
        },
        
        // B7 Otobüs - Batı çevre
        {
            id: 'B7',
            name: 'B7 Otobüs',
            type: 'bus',
            color: '#14b8a6',       // Teal
            speedFactor: 1.3,
            stops: ['S33', 'S31', 'S62', 'S80', 'S69', 'S44', 'S42', 'S77', 'S56', 'S49', 'S04']
        }
    ];

    // ============================================================
    // KENARLARI OLUŞTUR (Edges)
    // ============================================================
    const edges = [];
    
    for (const line of lines) {
        for (let i = 0; i < line.stops.length - 1; i++) {
            const fromId = line.stops[i];
            const toId = line.stops[i + 1];
            
            const fromStop = stops.find(s => s.id === fromId);
            const toStop = stops.find(s => s.id === toId);
            
            if (!fromStop || !toStop) continue;
            
            // Öklid mesafesi
            const dx = fromStop.x - toStop.x;
            const dy = fromStop.y - toStop.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Süre = mesafe / hız (hız faktörüne bağlı)
            // Metro hızlı, otobüs yavaş
            const duration = (distance / 50) * line.speedFactor;
            
            edges.push({
                from: fromId,
                to: toId,
                distance: Math.round(distance),
                duration: Math.round(duration * 10) / 10,
                lineId: line.id,
                lineName: line.name,
                lineType: line.type,
                lineColor: line.color
            });
        }
    }

    // Hat renkleri sözlüğü
    const lineColors = {};
    for (const line of lines) {
        lineColors[line.id] = {
            color: line.color,
            name: line.name,
            type: line.type
        };
    }

    return { stops, lines, edges, lineColors, MAP_WIDTH, MAP_HEIGHT };
}

/**
 * Şehir verisini grafa yükler
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
