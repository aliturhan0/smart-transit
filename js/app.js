/**
 * ============================================================
 *  Ana Uygulama (App) - Akıllı Toplu Taşıma ve Navigasyon
 * ============================================================
 * 
 * Tüm modülleri birleştirir ve kullanıcı etkileşimlerini yönetir:
 *   - Veri yapılarını oluşturur ve verileri yükler
 *   - Kullanıcı girişlerini işler
 *   - Algoritmaları çağırır
 *   - Sonuçları görselleştirir
 * ============================================================
 */

import { MapRenderer } from './renderer.js';

class TransitApp {
    constructor() {
        // Uygulama durumu
        this.mode = 'knn';              // 'knn' | 'route'
        this.algorithm = 'dijkstra';     // 'dijkstra' | 'astar'
        this.criterion = 'duration';     // 'distance' | 'duration'
        this.kValue = 5;
        this.transferPenalty = 3;
        this.startStopId = null;
        this.endStopId = null;

        // C# Backend API'den verileri çek ve uygulamayı başlat
        this.init();
    }

    async init() {
        try {
            console.log('📡 C# Backend API bağlantısı kuruluyor...');
            const response = await fetch('http://localhost:5099/api/data');
            this.cityData = await response.json();
            
            // Hızlı durak erişimi için yerel JS Map yapısını kullan
            this.stopsMap = new Map(this.cityData.stops.map(s => [s.id, s]));
            
            // Canvas ve renderer
            this.canvas = document.getElementById('map-canvas');
            this.renderer = new MapRenderer(this.canvas, this.cityData);
            
            // Olay dinleyicilerini kur
            this.setupEventListeners();
            
            // Hat listesini göster
            this.renderLineList();
            
            // Veri yapısı istatistiklerini göster
            this.updateDataStructureStats();
            
            // Araç simülasyonunu başlat
            this.renderer.startVehicleSimulation();
            
            console.log('✅ Akıllı Toplu Taşıma Sistemi C# Web API ile hazır!');
            console.log(`📊 ${this.cityData.stops.length} durak, ${this.cityData.lines.length} hat, ${this.cityData.edges.length} bağlantı yüklendi.`);
        } catch (error) {
            console.error('❌ C# API sunucusuna bağlanılamadı!', error);
            alert('C# API sunucusuna bağlanılamadı (http://localhost:5099). Lütfen C# backend uygulamasının çalıştığından emin olun.');
        }
    }

    // ============================================================
    // OLAY DİNLEYİCİLERİ
    // ============================================================
    
    setupEventListeners() {
        // --- Canvas tıklama ---
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // --- Canvas fare hareketi ---
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        
        // --- Canvas fare çıkışı ---
        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.setHoveredStop(null);
            this.canvas.style.cursor = 'crosshair';
        });
        
        // --- Mod seçimi ---
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.clearResults();
                this.updateModeUI();
            });
        });
        
        // --- Algoritma seçimi ---
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });
        
        // --- Optimizasyon kriteri ---
        document.getElementById('criterion-select').addEventListener('change', (e) => {
            this.criterion = e.target.value;
        });
        
        // --- K değeri ---
        document.getElementById('k-value').addEventListener('input', (e) => {
            this.kValue = parseInt(e.target.value) || 5;
            document.getElementById('k-display').textContent = this.kValue;
        });
        
        // --- Aktarma cezası ---
        document.getElementById('transfer-penalty').addEventListener('input', (e) => {
            this.transferPenalty = parseFloat(e.target.value) || 3;
            document.getElementById('penalty-display').textContent = this.transferPenalty;
        });
        
        // --- Sıfırla butonu ---
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.clearResults();
        });
        
        // --- Araç simülasyonu toggle ---
        document.getElementById('btn-simulation').addEventListener('click', () => {
            if (this.renderer.vehicleSimActive) {
                this.renderer.stopVehicleSimulation();
                document.getElementById('btn-simulation').textContent = '🚌 Simülasyonu Başlat';
                document.getElementById('btn-simulation').classList.remove('active');
            } else {
                this.renderer.startVehicleSimulation();
                document.getElementById('btn-simulation').textContent = '⏹ Simülasyonu Durdur';
                document.getElementById('btn-simulation').classList.add('active');
            }
        });
        
        // --- Pencere boyut değişikliği ---
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    // ============================================================
    // CANVAS ETKİLEŞİMLERİ
    // ============================================================
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        
        // Harita koordinatına çevir
        const mapPos = this.renderer.screenToMap(sx, sy);
        
        if (this.mode === 'knn') {
            this.performKnnSearch(mapPos);
        } else if (this.mode === 'route') {
            this.handleRouteSelection(mapPos, sx, sy);
        }
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        
        const stop = this.renderer.findStopAtScreen(sx, sy, 20);
        this.renderer.setHoveredStop(stop);
        
        this.canvas.style.cursor = stop ? 'pointer' : 'crosshair';
    }

    // ============================================================
    // KNN ARAMASI
    // ============================================================
    
    async performKnnSearch(mapPos) {
        try {
            const response = await fetch('http://localhost:5099/api/knn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: mapPos.x,
                    y: mapPos.y,
                    k: this.kValue
                })
            });
            const result = await response.json();

            // Sonuçları renderer'a gönder
            this.renderer.setKnnResults(result.results, mapPos);
            this.renderer.setRouteResult(null);
            this.renderer.setSelectedStops([]);
            
            // Sonuçları panelde göster
            this.displayKnnResults(result);
        } catch (error) {
            console.error('KNN API Hatası:', error);
        }
    }

    displayKnnResults(result) {
        const container = document.getElementById('results-content');
        
        let html = `<div class="stats-box">
            <div class="stats-title">📍 KNN Arama Sonuçları</div>
            <div class="stats-row">
                <span>Algoritma:</span><span>${result.stats.algorithm}</span>
            </div>
            <div class="stats-row">
                <span>K Değeri:</span><span>${result.stats.k}</span>
            </div>
            <div class="stats-row">
                <span>Bulunan:</span><span>${result.stats.resultCount} durak</span>
            </div>
            <div class="stats-row">
                <span>Süre:</span><span>${result.stats.executionTimeMs} ms</span>
            </div>
            <div class="stats-row">
                <span>Ağaç Yüksekliği:</span><span>${result.stats.treeHeight}</span>
            </div>
            <div class="stats-row">
                <span>Toplam Düğüm:</span><span>${result.stats.totalNodes}</span>
            </div>
        </div>`;
        
        html += '<div class="result-list">';
        for (let i = 0; i < result.results.length; i++) {
            const r = result.results[i];
            const stop = this.stopsMap.get(r.id);
            const stopLines = this.cityData.lines.filter(l => l.stops.includes(r.id));
            
            html += `<div class="result-item">
                <div class="result-rank">${i + 1}</div>
                <div class="result-info">
                    <div class="result-name">${r.name}</div>
                    <div class="result-meta">
                        Mesafe: ${r.distance.toFixed(1)} birim
                    </div>
                    <div class="result-lines">
                        ${stopLines.map(l => 
                            `<span class="line-tag" style="background:${l.color}20;color:${l.color};border:1px solid ${l.color}40">${l.name}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>`;
        }
        html += '</div>';
        
        container.innerHTML = html;
        
        // Sonuçlar panelini göster
        document.getElementById('results-panel').classList.add('visible');
    }

    // ============================================================
    // ROTA HESAPLAMA
    // ============================================================
    
    handleRouteSelection(mapPos, sx, sy) {
        // Tıklanan yere en yakın durağı bul (C# verileri üzerinden mesafe hesaplayarak)
        let nearestStop = null;
        let minDist = Infinity;
        for (const stop of this.cityData.stops) {
            const dx = stop.x - mapPos.x;
            const dy = stop.y - mapPos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                nearestStop = stop;
            }
        }
        
        if (!nearestStop) return;
        
        const nearestStopId = nearestStop.id;
        
        if (!this.startStopId) {
            // Başlangıç durağı seç
            this.startStopId = nearestStopId;
            this.renderer.setSelectedStops([this.startStopId]);
            this.renderer.setKnnResults([], null);
            
            document.getElementById('start-stop-name').textContent = nearestStop.name;
            document.getElementById('end-stop-name').textContent = 'Haritaya tıklayın...';
            
            // Sonuçlar panelini güncelle
            const container = document.getElementById('results-content');
            container.innerHTML = `<div class="stats-box">
                <div class="stats-title">🚏 Başlangıç Seçildi</div>
                <div class="stats-row">
                    <span>Durak:</span><span>${nearestStop.name}</span>
                </div>
                <p style="color:#94a3b8;font-size:12px;margin-top:10px;">
                    Bitiş durağını seçmek için haritaya tıklayın.
                </p>
            </div>`;
            document.getElementById('results-panel').classList.add('visible');
            
        } else if (!this.endStopId) {
            // Bitiş durağı seç
            if (nearestStop.id === this.startStopId) return; // Aynı durağa tıklamayı engelle
            
            this.endStopId = nearestStop.id;
            this.renderer.setSelectedStops([this.startStopId, this.endStopId]);
            
            document.getElementById('end-stop-name').textContent = nearestStop.name;
            
            // Rota hesapla
            this.calculateRoute();
        }
    }
    
    async calculateRoute() {
        if (!this.startStopId || !this.endStopId) return;
        
        try {
            const response = await fetch('http://localhost:5099/api/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startStopId: this.startStopId,
                    endStopId: this.endStopId,
                    algorithm: this.algorithm,
                    criterion: this.criterion,
                    transferPenalty: this.transferPenalty
                })
            });
            const result = await response.json();

            if (result.error || !result.found) {
                this.renderer.setRouteResult(null);
                const container = document.getElementById('results-content');
                container.innerHTML = `<div class="stats-box error">
                    <div class="stats-title">❌ Rota Bulunamadı</div>
                    <p>${result.error || 'Bu iki durak arasında bağlantı bulunamadı.'}</p>
                </div>`;
                document.getElementById('results-panel').classList.add('visible');
                return;
            }
            
            // Sonuçları renderer'a gönder
            this.renderer.setRouteResult(result);
            this.renderer.setKnnResults([], null);
            
            // Sonuçları panelde göster
            this.displayRouteResults(result, result.compResult);
        } catch (error) {
            console.error('Rota API Hatası:', error);
        }
    }

    displayRouteResults(result, compResult) {
        const container = document.getElementById('results-content');
        
        if (!result.found) {
            container.innerHTML = `<div class="stats-box error">
                <div class="stats-title">❌ Rota Bulunamadı</div>
                <p>Bu iki durak arasında bağlantı bulunamadı.</p>
            </div>`;
            document.getElementById('results-panel').classList.add('visible');
            return;
        }
        
        let html = '';
        
        // Rota özeti
        html += `<div class="stats-box route-summary">
            <div class="stats-title">🗺️ Rota Bulundu!</div>
            <div class="stats-row highlight">
                <span>Toplam Maliyet:</span>
                <span>${result.totalCost.toFixed(1)} ${this.criterion === 'distance' ? 'birim' : 'dk'}</span>
            </div>
            <div class="stats-row">
                <span>Toplam Mesafe:</span><span>${result.totalDistance.toFixed(0)} birim</span>
            </div>
            <div class="stats-row">
                <span>Toplam Süre:</span><span>${result.totalDuration.toFixed(1)} dk</span>
            </div>
            <div class="stats-row">
                <span>Durak Sayısı:</span><span>${result.path.length}</span>
            </div>
            <div class="stats-row ${result.transfers > 0 ? 'transfer' : ''}">
                <span>Aktarma:</span><span>${result.transfers} kez</span>
            </div>
        </div>`;
        
        // Segment detayları (hat bazlı)
        html += '<div class="segments">';
        html += '<div class="stats-title" style="margin-bottom: 8px;">📋 Güzergah Detayı</div>';
        
        for (let i = 0; i < result.segments.length; i++) {
            const seg = result.segments[i];
            
            html += `<div class="segment-card" style="border-left: 3px solid ${seg.lineColor}">
                <div class="segment-header">
                    <span class="line-tag" style="background:${seg.lineColor};color:#fff;">${seg.lineName}</span>
                    <span class="segment-meta">${seg.stops.length} durak • ${seg.distance.toFixed(0)} birim • ${seg.duration.toFixed(1)} dk</span>
                </div>
                <div class="segment-stops">
                    ${seg.stops.map((stopId, j) => {
                        const stop = this.stopsMap.get(stopId);
                        const isFirst = j === 0;
                        const isLast = j === seg.stops.length - 1;
                        let icon = '●';
                        if (isFirst && i === 0) icon = '🟢';
                        else if (isLast && i === result.segments.length - 1) icon = '🔴';
                        else if (isFirst || isLast) icon = '↔️';
                        
                        return `<div class="segment-stop ${isFirst || isLast ? 'endpoint' : ''}">
                            <span class="stop-icon">${icon}</span>
                            <span class="stop-name">${stop ? stop.name : stopId}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
            
            // Aktarma bilgisi
            if (i < result.segments.length - 1) {
                html += `<div class="transfer-badge">
                    ↕ Aktarma
                </div>`;
            }
        }
        html += '</div>';
        
        // Algoritma karşılaştırması
        html += `<div class="stats-box comparison">
            <div class="stats-title">📊 Algoritma Karşılaştırması</div>
            <table class="comp-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>${result.stats.algorithm}</th>
                        <th>${compResult.stats.algorithm}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Süre (ms)</td>
                        <td>${result.stats.executionTimeMs}</td>
                        <td>${compResult.stats.executionTimeMs}</td>
                    </tr>
                    <tr>
                        <td>Ziyaret Edilen</td>
                        <td>${result.stats.nodesVisited}</td>
                        <td>${compResult.stats.nodesVisited}</td>
                    </tr>
                    <tr>
                        <td>İncelenen Kenar</td>
                        <td>${result.stats.edgesExamined}</td>
                        <td>${compResult.stats.edgesExamined}</td>
                    </tr>
                    <tr>
                        <td>Maliyet</td>
                        <td>${result.totalCost.toFixed(1)}</td>
                        <td>${compResult.totalCost >= 0 ? compResult.totalCost.toFixed(1) : '∞'}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
        
        // Karmaşıklık analizi
        html += `<div class="stats-box">
            <div class="stats-title">📐 Karmaşıklık Analizi</div>
            <div class="complexity-info">
                <div class="complexity-row">
                    <span class="complexity-label">Dijkstra</span>
                    <span class="complexity-value">O((V+E) log V)</span>
                </div>
                <div class="complexity-row">
                    <span class="complexity-label">A*</span>
                    <span class="complexity-value">O((V+E) log V) *</span>
                </div>
                <div class="complexity-note">
                    * Heuristik sayesinde pratikte daha az düğüm ziyaret eder
                </div>
                <div class="complexity-row">
                    <span class="complexity-label">V (düğüm)</span>
                    <span class="complexity-value">${result.stats.totalVertices}</span>
                </div>
                <div class="complexity-row">
                    <span class="complexity-label">Verimlilik</span>
                    <span class="complexity-value">${((result.stats.nodesVisited / result.stats.totalVertices) * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>`;
        
        container.innerHTML = html;
        document.getElementById('results-panel').classList.add('visible');
    }

    // ============================================================
    // VERİ YAPISI İSTATİSTİKLERİ
    // ============================================================
    
    updateDataStructureStats() {
        const stats = this.cityData.stats;
        if (!stats) return;

        const container = document.getElementById('ds-stats');
        
        container.innerHTML = `
            <div class="ds-stat-item">
                <div class="ds-stat-name">🌳 KD-Tree (C#)</div>
                <div class="ds-stat-detail">${stats.kdTree.nodeCount} düğüm, yükseklik: ${stats.kdTree.actualHeight}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">🔗 Graf (C# Multigraph)</div>
                <div class="ds-stat-detail">${stats.graph.vertexCount} düğüm, ${stats.graph.edgeCount} kenar, ort. derece: ${stats.graph.avgDegree}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">#️⃣ Hash Tablo (C# Durak)</div>
                <div class="ds-stat-detail">${stats.stopTable.Size} kayıt, yük: ${stats.stopTable.LoadFactor}, maks. zincir: ${stats.stopTable.MaxChainLength}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">#️⃣ Hash Tablo (C# Hat)</div>
                <div class="ds-stat-detail">${stats.lineTable.Size} kayıt, yük: ${stats.lineTable.LoadFactor}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">📊 Min-Heap (C#)</div>
                <div class="ds-stat-detail">Dijkstra/A* sırasında backend'de kullanılır</div>
            </div>
        `;
    }

    // ============================================================
    // HAT LİSTESİ
    // ============================================================
    
    renderLineList() {
        const container = document.getElementById('line-list');
        let html = '';
        
        for (const line of this.cityData.lines) {
            const typeIcon = line.type === 'metro' ? '🚇' : 
                            line.type === 'tram' ? '🚊' : '🚌';
            
            html += `<div class="line-item" data-line="${line.id}">
                <div class="line-color" style="background:${line.color}"></div>
                <span class="line-icon">${typeIcon}</span>
                <span class="line-name">${line.name}</span>
                <span class="line-stop-count">${line.stops.length} durak</span>
            </div>`;
        }
        
        container.innerHTML = html;
    }

    // ============================================================
    // YARDIMCI İŞLEMLER
    // ============================================================
    
    clearResults() {
        this.startStopId = null;
        this.endStopId = null;
        this.renderer.clearAll();
        
        document.getElementById('start-stop-name').textContent = '-';
        document.getElementById('end-stop-name').textContent = '-';
        document.getElementById('results-content').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗺️</div>
                <p>Sonuçları görmek için haritaya tıklayın</p>
            </div>
        `;
        document.getElementById('results-panel').classList.remove('visible');
        
        this.updateModeUI();
    }
    
    updateModeUI() {
        const knnControls = document.getElementById('knn-controls');
        const routeControls = document.getElementById('route-controls');
        
        if (this.mode === 'knn') {
            knnControls.style.display = 'block';
            routeControls.style.display = 'none';
        } else {
            knnControls.style.display = 'none';
            routeControls.style.display = 'block';
        }
    }
}

// ============================================================
// UYGULAMA BAŞLAT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TransitApp();
});
