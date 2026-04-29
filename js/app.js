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

import { KdTree } from './kd-tree.js';
import { Graph } from './graph.js';
import { MinHeap } from './min-heap.js';
import { HashTable } from './hash-table.js';
import { findNearestStops, dijkstra, aStar } from './algorithms.js';
import { generateCityData, loadDataIntoStructures } from './synthetic-data.js';
import { MapRenderer } from './renderer.js';

class TransitApp {
    constructor() {
        // ============================================================
        // VERİ YAPILARI OLUŞTUR (Faz 1)
        // ============================================================
        
        // Sentetik veri üret
        this.cityData = generateCityData();
        
        // KD-Tree: Durak koordinatları için uzaysal indeks
        this.kdTree = new KdTree(this.cityData.stops.map(s => ({
            x: s.x, y: s.y, id: s.id, name: s.name
        })));
        
        // Graf: Toplu taşıma ağı (multigraph)
        this.graph = new Graph();
        
        // Hash Tabloları: Hızlı erişim
        this.stopTable = new HashTable();   // Durak ID → durak bilgisi
        this.lineTable = new HashTable();   // Hat ID → hat bilgileri
        
        // Verileri yapılara yükle
        loadDataIntoStructures(
            this.cityData, 
            this.graph, 
            this.kdTree, 
            this.stopTable, 
            this.lineTable
        );
        
        // ============================================================
        // ARAYÜZ (Faz 3)
        // ============================================================
        
        // Canvas ve renderer
        this.canvas = document.getElementById('map-canvas');
        this.renderer = new MapRenderer(this.canvas, this.cityData);
        
        // Uygulama durumu
        this.mode = 'knn';              // 'knn' | 'route'
        this.algorithm = 'dijkstra';     // 'dijkstra' | 'astar'
        this.criterion = 'duration';     // 'distance' | 'duration'
        this.kValue = 5;
        this.transferPenalty = 3;
        this.startStopId = null;
        this.endStopId = null;
        
        // Olay dinleyicilerini kur
        this.setupEventListeners();
        
        // Hat listesini göster
        this.renderLineList();
        
        // Veri yapısı istatistiklerini göster
        this.updateDataStructureStats();
        
        // Araç simülasyonunu başlat
        this.renderer.startVehicleSimulation();
        
        console.log('✅ Akıllı Toplu Taşıma Sistemi hazır!');
        console.log(`📊 ${this.cityData.stops.length} durak, ${this.cityData.lines.length} hat, ${this.cityData.edges.length} bağlantı yüklendi.`);
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
    
    performKnnSearch(mapPos) {
        // KD-Tree üzerinde KNN araması
        const result = findNearestStops(this.kdTree, mapPos, this.kValue);
        
        // Sonuçları renderer'a gönder
        this.renderer.setKnnResults(result.results, mapPos);
        this.renderer.setRouteResult(null);
        this.renderer.setSelectedStops([]);
        
        // Sonuçları panelde göster
        this.displayKnnResults(result);
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
            const stop = this.stopTable.get(r.id);
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
        // Tıklanan yere en yakın durağı bul
        const nearestResult = findNearestStops(this.kdTree, mapPos, 1);
        
        if (nearestResult.results.length === 0) return;
        
        const nearestStop = nearestResult.results[0];
        
        if (!this.startStopId) {
            // Başlangıç durağı seç
            this.startStopId = nearestStop.id;
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
    
    calculateRoute() {
        if (!this.startStopId || !this.endStopId) return;
        
        const options = {
            criterion: this.criterion,
            transferPenalty: this.transferPenalty
        };
        
        // Seçilen algoritmayı çalıştır
        let result;
        if (this.algorithm === 'astar') {
            result = aStar(this.graph, this.startStopId, this.endStopId, options);
        } else {
            result = dijkstra(this.graph, this.startStopId, this.endStopId, options);
        }
        
        // Karşılaştırma için diğer algoritmayı da çalıştır
        let compResult;
        if (this.algorithm === 'astar') {
            compResult = dijkstra(this.graph, this.startStopId, this.endStopId, options);
        } else {
            compResult = aStar(this.graph, this.startStopId, this.endStopId, options);
        }
        
        // Sonuçları renderer'a gönder
        this.renderer.setRouteResult(result);
        this.renderer.setKnnResults([], null);
        
        // Sonuçları panelde göster
        this.displayRouteResults(result, compResult);
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
                        const stop = this.stopTable.get(stopId);
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
        const kdStats = this.kdTree.getStats();
        const graphStats = this.graph.getStats();
        const stopTableStats = this.stopTable.getStats();
        const lineTableStats = this.lineTable.getStats();
        
        const container = document.getElementById('ds-stats');
        
        container.innerHTML = `
            <div class="ds-stat-item">
                <div class="ds-stat-name">🌳 KD-Tree</div>
                <div class="ds-stat-detail">${kdStats.nodeCount} düğüm, yükseklik: ${kdStats.actualHeight}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">🔗 Graf (Multigraph)</div>
                <div class="ds-stat-detail">${graphStats.vertexCount} düğüm, ${graphStats.edgeCount} kenar, ort. derece: ${graphStats.avgDegree}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">#️⃣ Hash Tablo (Durak)</div>
                <div class="ds-stat-detail">${stopTableStats.size} kayıt, yük: ${stopTableStats.loadFactor}, maks. zincir: ${stopTableStats.maxChainLength}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">#️⃣ Hash Tablo (Hat)</div>
                <div class="ds-stat-detail">${lineTableStats.size} kayıt, yük: ${lineTableStats.loadFactor}</div>
            </div>
            <div class="ds-stat-item">
                <div class="ds-stat-name">📊 Min-Heap</div>
                <div class="ds-stat-detail">Dijkstra/A* sırasında kullanılır</div>
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
