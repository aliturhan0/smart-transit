/**
 * ============================================================
 *  Harita Görselleştirici (Map Renderer)
 * ============================================================
 * 
 * Canvas tabanlı harita çizim sistemi:
 *   - Durakları çizer
 *   - Hat güzergahlarını çizer
 *   - KNN sonuçlarını vurgular
 *   - Hesaplanan rotayı animasyonlu çizer
 *   - Araç simülasyonu (opsiyonel)
 *   - Hover ve seçim efektleri
 * 
 * Performans: Tüm durak aramaları O(1) Map lookup ile yapılır.
 * ============================================================
 */

export class MapRenderer {
    constructor(canvas, cityData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cityData = cityData;
        
        // O(1) durak erişimi için Map
        this.stopsMap = new Map(cityData.stops.map(s => [s.id, s]));
        
        // Her durak için bağlı hatları önbellekle (drawStops'ta her frame hesaplamak yerine)
        this.stopLinesCache = new Map();
        for (const stop of cityData.stops) {
            const lines = cityData.lines.filter(l => l.stops.includes(stop.id));
            this.stopLinesCache.set(stop.id, lines);
        }
        
        // Harita boyutları
        this.mapWidth = cityData.MAP_WIDTH;
        this.mapHeight = cityData.MAP_HEIGHT;
        
        // Kenar boşlukları
        this.padding = 50;
        
        // Ölçekleme
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        // Mouse interactions for pan/zoom
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastOffsetX = 0;
        this.lastOffsetY = 0;
        
        // Zoom limits
        this.minScale = 0.5;
        this.maxScale = 5.0;
        
        // Durum
        this.hoveredStop = null;
        this.selectedStops = [];       // Seçili duraklar [startId, endId]
        this.knnResults = [];           // KNN sonuçları
        this.knnQueryPoint = null;      // KNN sorgu noktası
        this.routeResult = null;        // Hesaplanan rota
        this.routeEndpoints = null;     // { start, end } harita tıklama + yürüme
        
        // Araç simülasyonu
        this.vehicles = [];
        this.vehicleSimActive = false;
        
        // Hızlı Set'ler — rota/knn kontrolleri O(1) olsun
        this._knnResultIds = new Set();
        this._routePathIds = new Set();
        this._selectedStopSet = new Set();
        
        // Animasyon
        this.animationFrame = null;
        this.time = 0;
        
        // Boyutlandır
        this.resize();
        
        // Ana çizim döngüsü
        this.startRenderLoop();
    }

    /**
     * Canvas boyutunu pencereye göre ayarla
     */
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // DPI ölçekleme (retina ekranlar için)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
        
        // Ölçeklemeyi hesapla
        const usableWidth = this.displayWidth - this.padding * 2;
        const usableHeight = this.displayHeight - this.padding * 2;
        
        this.scaleX = usableWidth / this.mapWidth;
        this.scaleY = usableHeight / this.mapHeight;
        
        // En kücük ölçeği kullan (oranı koru)
        const baseScale = Math.min(this.scaleX, this.scaleY);
        
        // Sadece ilk yüklemede veya sıfırlamada offset/scale ayarla
        if (!this.initialized) {
            this.scaleX = baseScale;
            this.scaleY = baseScale;
            this.offsetX = (this.displayWidth - this.mapWidth * baseScale) / 2;
            this.offsetY = (this.displayHeight - this.mapHeight * baseScale) / 2;
            this.minScale = baseScale * 0.8; // Minimum zoom level
            this.initialized = true;
        }
    }

    /**
     * Harita koordinatından ekran koordinatına dönüşüm
     */
    mapToScreen(x, y) {
        return {
            x: x * this.scaleX + this.offsetX,
            y: y * this.scaleY + this.offsetY
        };
    }

    /**
     * Ekran koordinatından harita koordinatına dönüşüm
     */
    screenToMap(sx, sy) {
        return {
            x: (sx - this.offsetX) / this.scaleX,
            y: (sy - this.offsetY) / this.scaleY
        };
    }

    /**
     * Verilen ekran koordinatına en yakın durağı bul
     */
    findStopAtScreen(sx, sy, threshold = 15) {
        const mapPos = this.screenToMap(sx, sy);
        let closest = null;
        let closestDist = Infinity;
        
        for (const stop of this.cityData.stops) {
            const dx = stop.x - mapPos.x;
            const dy = stop.y - mapPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Piksel cinsinden mesafe
            const screenDist = dist * this.scaleX;
            
            if (screenDist < threshold && screenDist < closestDist) {
                closestDist = screenDist;
                closest = stop;
            }
        }
        
        return closest;
    }

    // --- Ana Çizim ---

    /**
     * Ana render döngüsü
     */
    startRenderLoop() {
        const animate = (timestamp) => {
            this.time = timestamp * 0.001; // saniye
            this.draw();
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * Tüm katmanları sırayla çizer
     */
    draw() {
        const ctx = this.ctx;
        
        // Arka plan — subtle gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.displayHeight);
        bgGrad.addColorStop(0, '#080e1c');
        bgGrad.addColorStop(1, '#0a1224');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Grid
        this.drawGrid();
        
        // Hat güzergahları
        this.drawLines();
        
        // Yürüme bacakları (kullanıcı konumu → durak)
        if (this.routeEndpoints) {
            this.drawWalkLegs();
        }

        // Rota
        if (this.routeResult && this.routeResult.found) {
            this.drawRoute();
        }
        
        // KNN sonuçları
        if (this.knnResults.length > 0) {
            this.drawKnnResults();
        }
        
        // KNN sorgu noktası
        if (this.knnQueryPoint) {
            this.drawQueryPoint();
        }
        
        // Duraklar
        this.drawStops();
        
        // Araç simülasyonu
        if (this.vehicleSimActive) {
            this.drawVehicles();
        }
        
        // Hover tooltip
        if (this.hoveredStop) {
            this.drawTooltip(this.hoveredStop);
        }
    }

    /**
     * Arka plan grid çizgilerini çizer
     */
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        
        const gridSize = 50; // harita birimi
        
        for (let x = 0; x <= this.mapWidth; x += gridSize) {
            const p = this.mapToScreen(x, 0);
            const p2 = this.mapToScreen(x, this.mapHeight);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.mapHeight; y += gridSize) {
            const p = this.mapToScreen(0, y);
            const p2 = this.mapToScreen(this.mapWidth, y);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    /**
     * Toplu taşıma hatlarını çizer — Map lookup kullanır
     */
    drawLines() {
        const ctx = this.ctx;
        
        for (const line of this.cityData.lines) {
            ctx.strokeStyle = line.color + '50';
            ctx.lineWidth = line.type === 'metro' ? 4 : line.type === 'tram' ? 3 : 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Metro hatları kesik çizgi
            if (line.type === 'metro') {
                ctx.setLineDash([]);
            } else if (line.type === 'tram') {
                ctx.setLineDash([8, 4]);
            } else {
                ctx.setLineDash([4, 4]);
            }
            
            ctx.beginPath();
            for (let i = 0; i < line.stops.length; i++) {
                const stop = this.stopsMap.get(line.stops[i]); // O(1) lookup
                if (!stop) continue;
                
                const p = this.mapToScreen(stop.x, stop.y);
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    /**
     * Durakları çizer — Set ile O(1) kontroller
     */
    drawStops() {
        const ctx = this.ctx;
        
        for (const stop of this.cityData.stops) {
            const p = this.mapToScreen(stop.x, stop.y);
            
            // Hangi hatlara ait? (önbelleklenmiş)
            const stopLines = this.stopLinesCache.get(stop.id);
            
            const isSelected = this._selectedStopSet.has(stop.id);
            const isHovered = this.hoveredStop && this.hoveredStop.id === stop.id;
            const isKnnResult = this._knnResultIds.has(stop.id);
            const isRouteStop = this._routePathIds.has(stop.id);
            
            let radius = 5;
            let color = '#3a4560';
            let glowColor = null;
            
            if (stopLines.length > 0) {
                color = stopLines[0].color;
            }
            
            if (isKnnResult) {
                radius = 8;
                glowColor = '#fbbf24';
                color = '#fbbf24';
            }
            
            if (isRouteStop) {
                radius = 7;
                color = '#ffffff';
            }
            
            if (isSelected) {
                radius = 10;
                color = '#10b981';
                glowColor = '#10b981';
            }
            
            if (isHovered) {
                radius = 9;
                glowColor = color;
            }
            
            // Glow efekti
            if (glowColor) {
                const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2);
                ctx.fillStyle = glowColor + Math.floor(pulse * 40).toString(16).padStart(2, '0');
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2);
                ctx.fillStyle = glowColor + '25';
                ctx.fill();
            }
            
            // Ana daire
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Kenar çizgisi
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#080e1c';
            ctx.stroke();
            
            // İç beyaz nokta (aktarma durağı ise)
            if (stopLines.length > 1) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
            
            // Seçili durak etiketi
            if (isSelected) {
                const isStart = this.selectedStops[0] === stop.id;
                const label = isStart ? 'BAŞLANGIÇ' : 'BİTİŞ';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = isStart ? '#10b981' : '#ef4444';
                ctx.fillText(label, p.x, p.y - radius - 12);
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(stop.name, p.x, p.y - radius - 2);
            }
        }
    }

    /**
     * KNN sonuçlarını vurgular — Map lookup
     */
    drawKnnResults() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.knnResults.length; i++) {
            const result = this.knnResults[i];
            const stop = this.stopsMap.get(result.id); // O(1)
            if (!stop) continue;
            
            const p = this.mapToScreen(stop.x, stop.y);
            
            // Çizgi: sorgu noktasından durağa
            if (this.knnQueryPoint) {
                const qp = this.mapToScreen(this.knnQueryPoint.x, this.knnQueryPoint.y);
                ctx.beginPath();
                ctx.moveTo(qp.x, qp.y);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = '#fbbf2440';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Sıra numarası
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Arka plan daire
            ctx.beginPath();
            ctx.arc(p.x + 14, p.y - 14, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#080e1c';
            ctx.stroke();
            
            // Numara
            ctx.fillStyle = '#080e1c';
            ctx.fillText(i + 1, p.x + 14, p.y - 14);
            
            // Durak adı
            ctx.textBaseline = 'alphabetic';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(stop.name, p.x, p.y + 18);
        }
    }

    /**
     * KNN sorgu noktasını çizer
     */
    drawQueryPoint() {
        const ctx = this.ctx;
        const p = this.mapToScreen(this.knnQueryPoint.x, this.knnQueryPoint.y);
        
        // Dışarıya doğru yayılan halka animasyonu
        const ripple = (this.time * 2) % 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + ripple * 30, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${1 - ripple})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // İkinci halka (offset)
        const ripple2 = ((this.time * 2) + 0.5) % 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + ripple2 * 30, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - ripple2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Artı işareti
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 8, p.y);
        ctx.lineTo(p.x + 8, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 8);
        ctx.lineTo(p.x, p.y + 8);
        ctx.stroke();
        
        // İç daire
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
    }

    /**
     * Başlangıç/bitiş tıklama noktasından en yakın durağa yürüme çizgisi
     */
    drawWalkLegs() {
        const ctx = this.ctx;
        const ep = this.routeEndpoints;
        if (!ep) return;

        const drawLeg = (point, color, label) => {
            if (!point) return;
            const stop = this.stopsMap.get(point.stopId);
            if (!stop) return;

            const clickP = this.mapToScreen(point.x, point.y);
            const stopP = this.mapToScreen(stop.x, stop.y);

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(clickP.x, clickP.y);
            ctx.lineTo(stopP.x, stopP.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(clickP.x, clickP.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(label, clickP.x, clickP.y - 14);
            ctx.restore();
        };

        drawLeg(ep.start, '#22c55e', 'BAŞLANGIÇ');
        drawLeg(ep.end, '#ef4444', 'BİTİŞ');
    }

    /**
     * Hesaplanan rotayı çizer — Map lookup
     */
    drawRoute() {
        const ctx = this.ctx;
        const route = this.routeResult;
        
        if (!route.segments || route.segments.length === 0) return;
        
        // Her segmenti ayrı renkte çiz
        for (const segment of route.segments) {
            const stops = segment.stops;
            
            ctx.strokeStyle = segment.lineColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([]);
            
            // Glow efekti
            ctx.shadowColor = segment.lineColor;
            ctx.shadowBlur = 14;
            
            ctx.beginPath();
            for (let i = 0; i < stops.length; i++) {
                const stop = this.stopsMap.get(stops[i]); // O(1)
                if (!stop) continue;
                
                const p = this.mapToScreen(stop.x, stop.y);
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Aktarma noktalarını işaretle
        if (route.segments.length > 1) {
            for (let i = 0; i < route.segments.length - 1; i++) {
                const transferStopId = route.segments[i].stops[route.segments[i].stops.length - 1];
                const stop = this.stopsMap.get(transferStopId); // O(1)
                if (!stop) continue;
                
                const p = this.mapToScreen(stop.x, stop.y);
                
                // Aktarma işareti - çift daire
                const pulse = Math.sin(this.time * 4) * 0.3 + 0.7;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, 14 * pulse, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                
                // Transfer ikonu (ok)
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#080e1c';
                ctx.fillText('↔', p.x, p.y);
                
                // Etiket
                ctx.textBaseline = 'alphabetic';
                ctx.font = 'bold 9px Inter, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('AKTARMA', p.x, p.y + 22);
            }
        }
        
        // Animasyonlu hareket eden nokta (rota üzerinde)
        this.drawRouteAnimation(route);
    }

    /**
     * Rota üzerinde hareket eden animasyonlu nokta — Map lookup
     */
    drawRouteAnimation(route) {
        const ctx = this.ctx;
        const allStops = route.path;
        if (allStops.length < 2) return;
        
        // Toplam yol uzunluğunu hesapla
        let totalLength = 0;
        const segLengths = [];
        
        for (let i = 0; i < allStops.length - 1; i++) {
            const s1 = this.stopsMap.get(allStops[i]); // O(1)
            const s2 = this.stopsMap.get(allStops[i + 1]); // O(1)
            if (!s1 || !s2) { segLengths.push(0); continue; }
            
            const p1 = this.mapToScreen(s1.x, s1.y);
            const p2 = this.mapToScreen(s2.x, s2.y);
            const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            segLengths.push(len);
            totalLength += len;
        }
        
        // Animasyon t değeri (0-1 arası, döngüsel)
        const speed = 0.15;
        const t = (this.time * speed) % 1;
        const targetDist = t * totalLength;
        
        // Hangi segmentte olduğumuzu bul
        let accumulated = 0;
        for (let i = 0; i < segLengths.length; i++) {
            if (accumulated + segLengths[i] >= targetDist) {
                const localT = (targetDist - accumulated) / segLengths[i];
                const s1 = this.stopsMap.get(allStops[i]); // O(1)
                const s2 = this.stopsMap.get(allStops[i + 1]); // O(1)
                if (!s1 || !s2) break;
                
                const p1 = this.mapToScreen(s1.x, s1.y);
                const p2 = this.mapToScreen(s2.x, s2.y);
                
                const px = p1.x + (p2.x - p1.x) * localT;
                const py = p1.y + (p2.y - p1.y) * localT;
                
                // Hareket eden nokta
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // İz
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffffff40';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                break;
            }
            accumulated += segLengths[i];
        }
    }

    /**
     * Tooltip çizer
     */
    drawTooltip(stop) {
        const ctx = this.ctx;
        const p = this.mapToScreen(stop.x, stop.y);
        
        // Hangi hatlara ait? (cache)
        const stopLines = this.stopLinesCache.get(stop.id) || [];
        const lineNames = stopLines.map(l => l.name).join(', ');
        
        const text1 = stop.name;
        const text2 = `ID: ${stop.id}`;
        const text3 = lineNames || 'Bağlı hat yok';
        
        ctx.font = 'bold 12px Inter, sans-serif';
        const w1 = ctx.measureText(text1).width;
        ctx.font = '10px Inter, sans-serif';
        const w2 = ctx.measureText(text2).width;
        const w3 = ctx.measureText(text3).width;
        
        const boxWidth = Math.max(w1, w2, w3) + 24;
        const boxHeight = 66;
        
        let boxX = p.x - boxWidth / 2;
        let boxY = p.y - boxHeight - 18;
        
        // Ekran dışına çıkmasını engelle
        if (boxX < 5) boxX = 5;
        if (boxX + boxWidth > this.displayWidth - 5) boxX = this.displayWidth - boxWidth - 5;
        if (boxY < 5) boxY = p.y + 18;
        
        // Arka plan — glassmorphism efekti
        ctx.fillStyle = '#131c2eee';
        ctx.strokeStyle = '#3b82f640';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // Üst gradient çizgi
        const gradLine = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY);
        gradLine.addColorStop(0, '#3b82f6');
        gradLine.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradLine;
        ctx.fillRect(boxX + 1, boxY + 1, boxWidth - 2, 2);
        
        // Metin
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(text1, boxX + 12, boxY + 10);
        
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(text2, boxX + 12, boxY + 28);
        
        // Hat renkleri
        let hatX = boxX + 12;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(text3, hatX, boxY + 44);
    }

    /**
     * Yuvarlak köşeli dikdörtgen
     */
    roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    }

    // --- Araç Simülasyonu ---

    /**
     * Araç simülasyonunu başlatır
     */
    startVehicleSimulation() {
        this.vehicles = [];
        
        for (const line of this.cityData.lines) {
            if (line.stops.length < 2) continue;
            
            // Her hat için 1-2 araç oluştur
            const vehicleCount = line.type === 'metro' ? 2 : 1;
            
            for (let v = 0; v < vehicleCount; v++) {
                this.vehicles.push({
                    lineId: line.id,
                    lineColor: line.color,
                    lineType: line.type,
                    stops: line.stops,
                    offset: v * 0.5, // Başlangıç zamanlarını ayır
                    speed: line.type === 'metro' ? 0.08 : 
                           line.type === 'tram' ? 0.06 : 0.04
                });
            }
        }
        
        this.vehicleSimActive = true;
    }

    /**
     * Araç simülasyonunu durdurur
     */
    stopVehicleSimulation() {
        this.vehicleSimActive = false;
        this.vehicles = [];
    }

    /**
     * Araçları çizer — Map lookup
     */
    drawVehicles() {
        const ctx = this.ctx;
        
        for (const vehicle of this.vehicles) {
            const stops = vehicle.stops;
            if (stops.length < 2) continue;
            
            // Toplam yolu hesapla
            let totalLen = 0;
            const segs = [];
            
            for (let i = 0; i < stops.length - 1; i++) {
                const s1 = this.stopsMap.get(stops[i]); // O(1)
                const s2 = this.stopsMap.get(stops[i + 1]); // O(1)
                if (!s1 || !s2) { segs.push(0); continue; }
                
                const dx = s2.x - s1.x;
                const dy = s2.y - s1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                segs.push(len);
                totalLen += len;
            }
            
            // Gidiş-dönüş animasyonu
            const t = ((this.time * vehicle.speed + vehicle.offset) % 2);
            const progress = t < 1 ? t : 2 - t; // 0→1→0 bounce
            const targetDist = progress * totalLen;
            
            let acc = 0;
            for (let i = 0; i < segs.length; i++) {
                if (acc + segs[i] >= targetDist || i === segs.length - 1) {
                    const localT = segs[i] > 0 ? 
                        Math.min(1, (targetDist - acc) / segs[i]) : 0;
                    
                    const s1 = this.stopsMap.get(stops[i]); // O(1)
                    const s2 = this.stopsMap.get(stops[i + 1]); // O(1)
                    if (!s1 || !s2) break;
                    
                    const p1 = this.mapToScreen(s1.x, s1.y);
                    const p2 = this.mapToScreen(s2.x, s2.y);
                    
                    const px = p1.x + (p2.x - p1.x) * localT;
                    const py = p1.y + (p2.y - p1.y) * localT;
                    
                    // Araç şekli
                    const size = vehicle.lineType === 'metro' ? 8 : 
                                vehicle.lineType === 'tram' ? 7 : 6;
                    
                    // Glow
                    ctx.shadowColor = vehicle.lineColor;
                    ctx.shadowBlur = 10;
                    
                    // Yuvarlak kare
                    ctx.beginPath();
                    this.roundRect(ctx, px - size, py - size/1.5, size * 2, size * 1.3, 3);
                    ctx.fillStyle = vehicle.lineColor;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff44';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                    
                    break;
                }
                acc += segs[i];
            }
        }
    }

    // --- Durum Güncelleme ---

    setHoveredStop(stop) {
        this.hoveredStop = stop;
    }

    setSelectedStops(stops) {
        this.selectedStops = stops;
        this._selectedStopSet = new Set(stops);
    }

    setKnnResults(results, queryPoint) {
        this.knnResults = results || [];
        this.knnQueryPoint = queryPoint || null;
        this._knnResultIds = new Set(this.knnResults.map(r => r.id));
    }

    setRouteResult(result) {
        this.routeResult = result;
        if (result && result.found && result.path) {
            this._routePathIds = new Set(result.path);
        } else {
            this._routePathIds = new Set();
        }
    }

    setRouteEndpoints(endpoints) {
        this.routeEndpoints = endpoints;
    }

    clearAll() {
        this.knnResults = [];
        this.knnQueryPoint = null;
        this.routeResult = null;
        this.routeEndpoints = null;
        this.selectedStops = [];
        this._knnResultIds = new Set();
        this._routePathIds = new Set();
        this._selectedStopSet = new Set();
    }

    resetView() {
        this.initialized = false;
        this.resize();
    }

    /**
     * Pan handling methods
     */
    startPan(clientX, clientY) {
        this.isDragging = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.lastOffsetX = this.offsetX;
        this.lastOffsetY = this.offsetY;
        this.canvas.style.cursor = 'grabbing';
    }

    updatePan(clientX, clientY) {
        if (!this.isDragging) return false;
        
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;
        
        this.offsetX = this.lastOffsetX + dx;
        this.offsetY = this.lastOffsetY + dy;
        return true; // indicates pan happened
    }

    endPan() {
        this.isDragging = false;
        this.canvas.style.cursor = this.hoveredStop ? 'pointer' : 'crosshair';
    }

    /**
     * Zoom handling
     */
    handleZoom(clientX, clientY, deltaY) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = clientX - rect.left;
        const sy = clientY - rect.top;
        
        // Fare altındaki harita koordinatını bul
        const mapPos = this.screenToMap(sx, sy);
        
        // Zoom faktörünü belirle (scroll yönüne göre)
        const zoomIntensity = 0.1;
        const zoomFactor = deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
        
        let newScale = this.scaleX * zoomFactor;
        
        // Limitler
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        
        // Yeni ölçeği uygula
        this.scaleX = newScale;
        this.scaleY = newScale;
        
        // Offseti güncelle: farenin altındaki nokta sabit kalmalı
        this.offsetX = sx - (mapPos.x * this.scaleX);
        this.offsetY = sy - (mapPos.y * this.scaleY);
    }

    /**
     * Render döngüsünü durdurur
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
