/**
 * ============================================================
 *  Min-Heap (Minimum Yığın) - Öncelik Kuyruğu
 * ============================================================
 * 
 * Dijkstra ve A* algoritmalarında en düşük maliyetli düğümü
 * seçmek için kullanılır.
 * 
 * Yapı: İkili ağaç, dizi (array) üzerinde temsil edilir.
 *   - Ebeveyn indeksi:  Math.floor((i - 1) / 2)
 *   - Sol çocuk indeksi: 2 * i + 1
 *   - Sağ çocuk indeksi: 2 * i + 2
 * 
 * Zaman Karmaşıklığı:
 *   - Ekleme (insert):      O(log N)
 *   - Çıkarma (extractMin): O(log N)
 *   - En küçüğe bakma (peek): O(1)
 * 
 * Uzay Karmaşıklığı: O(N)
 * ============================================================
 */

export class MinHeap {
    constructor(compareFn = null) {
        // Heap elemanlarını tutan dizi
        this.heap = [];
        
        // Karşılaştırma fonksiyonu - varsayılan olarak .cost alanına göre
        this.compare = compareFn || ((a, b) => a.cost - b.cost);
    }

    // --- Temel İşlemler ---

    /**
     * Heap'e yeni eleman ekler
     * Zaman: O(log N) - yukarı yüzme (bubble up) işlemi
     */
    insert(element) {
        this.heap.push(element);
        this._bubbleUp(this.heap.length - 1);
    }

    /**
     * En küçük elemanı çıkarır ve döndürür
     * Zaman: O(log N) - aşağı batma (sink down) işlemi
     */
    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        // Son elemanı köke taşı
        this.heap[0] = this.heap.pop();
        // Aşağı batır
        this._sinkDown(0);
        return min;
    }

    /**
     * En küçük elemana bakar (çıkarmadan)
     * Zaman: O(1)
     */
    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    /**
     * Heap'in boş olup olmadığını kontrol eder
     * Zaman: O(1)
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Heap'teki eleman sayısını döndürür
     * Zaman: O(1)
     */
    get size() {
        return this.heap.length;
    }

    /**
     * Heap'i tamamen temizler
     */
    clear() {
        this.heap = [];
    }

    // --- Yardımcı İç İşlemler ---

    /**
     * Yukarı Yüzme (Bubble Up / Percolate Up)
     * Yeni eklenen elemanı doğru konumuna taşır
     * Ebeveyn daha büyükse yer değiştirir
     */
    _bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            
            // Ebeveyn daha küçükse, heap özelliği sağlanıyor
            if (this.compare(this.heap[parentIndex], this.heap[index]) <= 0) {
                break;
            }
            
            // Yer değiştir (swap)
            [this.heap[parentIndex], this.heap[index]] = 
                [this.heap[index], this.heap[parentIndex]];
            
            index = parentIndex;
        }
    }

    /**
     * Aşağı Batma (Sink Down / Percolate Down)
     * Kök elemanı doğru konumuna taşır
     * En küçük çocukla yer değiştirir
     */
    _sinkDown(index) {
        const length = this.heap.length;
        
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            // Sol çocuk daha küçükse
            if (leftChild < length && 
                this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
                smallest = leftChild;
            }

            // Sağ çocuk daha küçükse
            if (rightChild < length && 
                this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
                smallest = rightChild;
            }

            // Yer değiştirme gerekmiyorsa dur
            if (smallest === index) break;

            // Yer değiştir
            [this.heap[smallest], this.heap[index]] = 
                [this.heap[index], this.heap[smallest]];
            
            index = smallest;
        }
    }

    /**
     * Heap'in geçerliliğini kontrol eder (debug için)
     * Her ebeveyn, çocuklarından küçük veya eşit olmalı
     */
    isValid() {
        for (let i = 0; i < this.heap.length; i++) {
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            
            if (left < this.heap.length && 
                this.compare(this.heap[i], this.heap[left]) > 0) {
                return false;
            }
            if (right < this.heap.length && 
                this.compare(this.heap[i], this.heap[right]) > 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Heap içeriğini dizi olarak döndürür (sıralı değil)
     */
    toArray() {
        return [...this.heap];
    }
}
