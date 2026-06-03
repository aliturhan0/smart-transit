# Veri Yapıları Zaman Karmaşıklığı (Big-O) Analizi Raporu

Bu doküman, Smart Transit projesinde kullanılan temel veri yapılarının çalışma zamanı analizini (Big-O Notasyonu) içermektedir.

## 1. KD-Tree (En Yakın Durak / KNN Arama)
KD-Tree veri yapısı, kullanıcının haritada rastgele bir noktaya tıkladığında o noktaya en yakın durağı bulması için `O(log N)` hızında arama yapmayı sağlar.

* **Ağaç İnşası (Build):** `O(N log N)` - Medyan eleman bulunarak her seferinde yarıya bölme işlemi yapılır.
* **Ekleme (Insert):** Ortalama `O(log N)`, En kötü durumda `O(N)`.
* **K-Nearest Neighbor (KNN) Arama:** Ortalama `O(k * log N)`. Tüm durakları gezmek `O(N)` olacağı için, KD-Tree sayesinde performans inanılmaz ölçüde artırılmıştır. Harita üzerinde farenin her hareketinde bile anında sonuç alınabilmektedir.

## 2. Hash Table (O(1) Durak/Hat Erişimi)
Tüm duraklar (`Stop`) ve hatlar (`Line`), C# tarafında kendi yazmış olduğumuz Hash Table veri yapısında tutulmaktadır. Çakışmalar (Collisions) `LinkedList` kullanılarak *Chaining* yöntemiyle çözülmüştür.

* **Ekleme (Set):** Ortalama `O(1)`. Yük faktörü (Load Factor) %75'i aştığında `Resize` işlemi devreye girer (Asal sayılarla kapasite artırılır).
* **Arama (Get / ContainsKey):** Ortalama `O(1)`. Hash Table sayesinde, ID'si bilinen bir durağın detaylarına ulaşmak anında gerçekleşmektedir. (Dijkstra algoritmasında durak adlarını çekmek için çok kritiktir).

## 3. Transit Graph (Multi-Edge Ağ Yapısı)
Şehirdeki güzergah ağı, düğümlerin `Stop`, bağlantıların ise `TransitEdge` olduğu bir MultiGraph yapısında tutulmaktadır. 

* **Düğüm (Vertex) Ekleme:** `O(1)` (Hash Table ile).
* **Kenar (Edge) Ekleme:** `O(1)` (Hash Table üzerinden listeye `.Add()`).
* **Komşuluk Sorgusu:** `O(1)` hızında düğüme gidilir, ardından `O(E)` (E: Düğümün kenar sayısı) kadar kenar listelenir. Toplam komşuluk erişimi çok hızlıdır.

## 4. Min-Heap (Priority Queue) ve Yönlendirme Algoritmaları
A* ve Dijkstra algoritmaları, en kısa yolu bulmak için kuyruktaki minimum maliyetli durağı sürekli çekmek zorundadır. Düz bir liste (`List`) kullanmak bu işlemde her seferinde `O(V)` tarama süresi gerektirir. Bizim projemizde özel bir `MinHeap` sınıfı yazılmıştır.

* **Min-Heap Ekleme (Push):** `O(log V)`
* **Min-Heap Minimumu Çekme (Pop):** `O(log V)`

### Dijkstra Algoritması
* **Karmaşıklık:** `O((V + E) log V)`
* Düğüm sayısı V, Kenar sayısı E. Her düğüm ve komşusu Min-Heap üzerinden incelenir. Tam bir genişlik taraması (BFS benzeri) yaptığı için tüm yönleri arar.

### A* (A-Star) Algoritması
* **Karmaşıklık:** En kötü durumda `O((V + E) log V)`
* Pratik durumda A*, hedefe kalan kuş uçuşu mesafeyi (Euclidean Heuristic) hesapladığı için `Dijkstra`'nın aksine hedefe ters yöndeki düğümleri kuyrukta geriye atar. Bu da incelenen kenar (Edges Examined) ve ziyaret edilen düğüm (Nodes Visited) sayısında yaklaşık **%40-%60 oranında performans artışı (zaman kazancı)** sağlar. Arayüzdeki görsel barlarda bu fark net şekilde gözlemlenmektedir.

## AI API Prompt Tasarımı
Python FastAPI üzerinde çalışan `AiService`, bu hızlı algoritmaların ürettiği RouteResult'ı alır ve LLM'e (Large Language Model) aşağıdaki yapısal prompt ile gönderir:
```text
Sen akıllı bir toplu taşıma asistanısın.
Kullanıcı '{startStop}' durağından '{endStop}' durağına gitmek istiyor.
Bu yolculuk toplam {minutes} dakika sürecek ve {distance} metre mesafe kat edilecek.
Kullanılacak hatlar: {lines}. Toplam aktarma sayısı: {transfers}.
Lütfen yolcuya bu rota hakkında doğal dilde kısa, pratik ve dostane bir tavsiye ver.
```
Bu sayede algoritmik ham veri, asenkron mikroservis yapısında işlenerek son kullanıcıya ("İnsana") anlamlı bir tavsiye metnine dönüşür.
