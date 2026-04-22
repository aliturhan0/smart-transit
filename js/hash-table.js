/**
 * ============================================================
 *  Karma Tablo (Hash Table) - Ayrık Zincirleme (Separate Chaining)
 * ============================================================
 * 
 * Durak ve hat bilgilerine hızlı erişim sağlar.
 *   - Durak ID → durak bilgisi
 *   - Hat ID → hat üzerindeki duraklar
 * 
 * Çarpışma Çözümü: Ayrık Zincirleme (Separate Chaining)
 *   - Her kova (bucket) bir dizi (array) tutar
 *   - Aynı hash değerine sahip elemanlar aynı kovada saklanır
 * 
 * Zaman Karmaşıklığı:
 *   - Ekleme (set):    Ortalama O(1), En kötü O(N)
 *   - Erişim (get):    Ortalama O(1), En kötü O(N)
 *   - Silme (delete):  Ortalama O(1), En kötü O(N)
 *   - Arama (has):     Ortalama O(1), En kötü O(N)
 * 
 * Uzay Karmaşıklığı: O(N)
 * 
 * Yük Faktörü (Load Factor):
 *   - Eşik: 0.75
 *   - Aşıldığında tablo boyutu 2 katına çıkarılır (rehash)
 * ============================================================
 */

export class HashTable {
    constructor(initialCapacity = 53) {
        // Başlangıç kapasitesi (asal sayı tercih edilir)
        this.capacity = this._nextPrime(initialCapacity);
        
        // Kova dizisi - her eleman bir zincir (array of [key, value])
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
        
        // Saklanan eleman sayısı
        this._size = 0;
        
        // Yük faktörü eşiği
        this.loadFactorThreshold = 0.75;
    }

    // --- Temel İşlemler ---

    /**
     * Anahtar-değer çifti ekler veya günceller
     * Zaman: Ortalama O(1)
     */
    set(key, value) {
        // Yük faktörünü kontrol et, gerekirse yeniden boyutlandır
        if (this._size / this.capacity > this.loadFactorThreshold) {
            this._resize(this.capacity * 2);
        }

        const index = this._hash(key);
        const bucket = this.buckets[index];

        // Anahtar zaten varsa güncelle
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket[i][1] = value;
                return;
            }
        }

        // Yeni eleman ekle
        bucket.push([key, value]);
        this._size++;
    }

    /**
     * Anahtara karşılık gelen değeri döndürür
     * Zaman: Ortalama O(1)
     * Bulunamazsa undefined döndürür
     */
    get(key) {
        const index = this._hash(key);
        const bucket = this.buckets[index];

        for (const [k, v] of bucket) {
            if (k === key) return v;
        }

        return undefined;
    }

    /**
     * Anahtarın tabloda olup olmadığını kontrol eder
     * Zaman: Ortalama O(1)
     */
    has(key) {
        const index = this._hash(key);
        const bucket = this.buckets[index];

        for (const [k] of bucket) {
            if (k === key) return true;
        }

        return false;
    }

    /**
     * Anahtarı ve değerini tablodan siler
     * Zaman: Ortalama O(1)
     * Silindiyse true, bulunamadıysa false döndürür
     */
    delete(key) {
        const index = this._hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket.splice(i, 1);
                this._size--;
                return true;
            }
        }

        return false;
    }

    /**
     * Tablodaki eleman sayısını döndürür
     * Zaman: O(1)
     */
    get size() {
        return this._size;
    }

    /**
     * Tablodaki tüm anahtarları döndürür
     * Zaman: O(N + M) - N: eleman sayısı, M: kova sayısı
     */
    keys() {
        const result = [];
        for (const bucket of this.buckets) {
            for (const [key] of bucket) {
                result.push(key);
            }
        }
        return result;
    }

    /**
     * Tablodaki tüm değerleri döndürür
     * Zaman: O(N + M)
     */
    values() {
        const result = [];
        for (const bucket of this.buckets) {
            for (const [, value] of bucket) {
                result.push(value);
            }
        }
        return result;
    }

    /**
     * Tablodaki tüm [anahtar, değer] çiftlerini döndürür
     * Zaman: O(N + M)
     */
    entries() {
        const result = [];
        for (const bucket of this.buckets) {
            for (const entry of bucket) {
                result.push([entry[0], entry[1]]);
            }
        }
        return result;
    }

    /**
     * Her eleman üzerinde fonksiyon çalıştırır
     */
    forEach(callback) {
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                callback(value, key, this);
            }
        }
    }

    /**
     * Tabloyu temizler
     */
    clear() {
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
        this._size = 0;
    }

    // --- Hash Fonksiyonu ---

    /**
     * Polinom Hash Fonksiyonu (Polynomial Rolling Hash)
     * 
     * Her karakter için: hash = (hash * PRIME + charCode) % capacity
     * PRIME sayısı: 31 (küçük asal sayı, dağılımı iyileştirir)
     * 
     * String olmayan anahtarlar toString() ile stringe çevrilir
     */
    _hash(key) {
        const str = String(key);
        const PRIME = 31;
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            hash = (hash * PRIME + charCode) % this.capacity;
        }

        return hash;
    }

    // --- Yeniden Boyutlandırma ---

    /**
     * Tablo boyutunu değiştirir ve tüm elemanları yeniden hash'ler
     * Yük faktörü eşiği aşıldığında çağrılır
     * Zaman: O(N) - tüm elemanlar yeniden yerleştirilir
     */
    _resize(newCapacity) {
        const newCap = this._nextPrime(newCapacity);
        const oldBuckets = this.buckets;
        
        this.capacity = newCap;
        this.buckets = new Array(newCap).fill(null).map(() => []);
        this._size = 0;

        // Tüm eski elemanları yeni tabloya ekle
        for (const bucket of oldBuckets) {
            for (const [key, value] of bucket) {
                this.set(key, value);
            }
        }
    }

    /**
     * Verilen sayıdan büyük veya eşit en küçük asal sayıyı bulur
     * Asal sayı kapasitesi, hash dağılımını iyileştirir
     */
    _nextPrime(n) {
        if (n <= 2) return 2;
        if (n % 2 === 0) n++;
        
        while (!this._isPrime(n)) {
            n += 2;
        }
        return n;
    }

    /**
     * Sayının asal olup olmadığını kontrol eder
     */
    _isPrime(n) {
        if (n < 2) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }

    /**
     * Mevcut yük faktörünü döndürür (debug/analiz için)
     */
    getLoadFactor() {
        return this._size / this.capacity;
    }

    /**
     * Tablo istatistiklerini döndürür (debug/analiz için)
     */
    getStats() {
        let emptyBuckets = 0;
        let maxChainLength = 0;
        let totalChainLength = 0;

        for (const bucket of this.buckets) {
            if (bucket.length === 0) emptyBuckets++;
            maxChainLength = Math.max(maxChainLength, bucket.length);
            totalChainLength += bucket.length;
        }

        return {
            capacity: this.capacity,
            size: this._size,
            loadFactor: (this._size / this.capacity).toFixed(3),
            emptyBuckets,
            maxChainLength,
            avgChainLength: this._size > 0 
                ? (totalChainLength / (this.capacity - emptyBuckets)).toFixed(2) 
                : 0
        };
    }
}
