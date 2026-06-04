# Smart Transit Projesi UML Diyagramları

İstediğin gibi projeyi ve kurduğun gelişmiş veri yapılarını (Graph, KD-Tree, KNN) detaylıca anlatan UML diyagramlarını hazırladım. Aşağıdaki diyagramlar sistemin Domain katmanının mimarisini, veri ilişkilerini ve algoritmik akışlarını detaylandırmaktadır.

## 1. Genel Sınıf Diyagramı (Class Diagram)
Bu diyagram, sistemdeki temel sınıfları (`TransitGraph`, `Stop`, `TransitEdge`, `KdTree`, `HashTable`) ve birbirleriyle olan sıkı ilişkilerini gösterir.

```mermaid
classDiagram
    class Stop {
        +int Id
        +string Name
        +double Latitude
        +double Longitude
    }

    class TransitEdge {
        +int FromStopId
        +int ToStopId
        +string LineId
        +double TravelMinutes
        +double DistanceMeters
    }

    class TransitGraph {
        -HashTable~int, Stop~ _stops
        -HashTable~int, List~TransitEdge~~ _adjacency
        +HashTable~int, Stop~ Stops
        +HashTable~int, List~TransitEdge~~ Adjacency
        +AddStop(Stop stop)
        +AddEdge(TransitEdge edge)
    }

    class HashTable~TKey, TValue~ {
        -LinkedList~Entry~[] _buckets
        -int _size
        -int _capacity
        +int Size
        +int Capacity
        +Set(TKey key, TValue value)
        +TValue Get(TKey key)
        +bool ContainsKey(TKey key)
        +bool Remove(TKey key)
    }

    class KdTreeNode {
        +Stop Point
        +int Depth
        +KdTreeNode Left
        +KdTreeNode Right
    }

    class KdTree {
        -KdTreeNode _root
        -int _nodeCount
        +KdTreeNode Root
        +int NodeCount
        +string DeveloperAliTurhan
        +BuildBalanced(List~Stop~ points, int depth)
        +Insert(Stop point)
        +List~KnnResult~ Knn(double targetLat, double targetLon, int k)
        +GetHeight()
    }

    class KnnResult {
        +Stop Point
        +double DistanceSq
        +double Distance
    }

    TransitGraph --> "1" HashTable : Kullanır (Stops & Adjacency)
    HashTable ..> Stop : TValue (Stops için)
    HashTable ..> TransitEdge : TValue (List olarak)
    
    KdTree "1" *-- "1..*" KdTreeNode : İçerir
    KdTreeNode "1" *-- "1" Stop : Tutar
    KdTree ..> KnnResult : Döndürür
    KnnResult "1" *-- "1" Stop : Tutar
```

## 2. Graph (Çizge) Veri Yapısı Detayı
Bu diyagram `TransitGraph` yapısının durakları (`Stop`) ve aralarındaki bağlantıları (`TransitEdge`) kendi yazdığın `HashTable` yapısı içinde nasıl tuttuğunu gösterir.

```mermaid
classDiagram
    class TransitGraph {
        <<Graph Veri Yapısı>>
    }
    
    class HashTable_Stops {
        <<Dictionary / Map>>
        +Key: int (Stop Id)
        +Value: Stop (Durak Nesnesi)
    }

    class HashTable_Adjacency {
        <<Dictionary / Map>>
        +Key: int (Stop Id)
        +Value: List~TransitEdge~ (Bağlı Kenarlar)
    }

    TransitGraph *-- HashTable_Stops : _stops
    TransitGraph *-- HashTable_Adjacency : _adjacency
    
    HashTable_Stops --> Stop : İçerir
    HashTable_Adjacency --> TransitEdge : İçerir
```

## 3. KD-Tree Uzaysal Ağaç Yapısı
KD-Tree sınıfının çalışma mantığını ve Depth değerine (Derinliğe) göre eksen değişimini gösteren mantıksal UML yapısı.

```mermaid
classDiagram
    class RootNode_Depth0 {
        <<Eksen: Latitude (X)>>
        +Stop: Kadıköy
        +Left: Düğüm (Lat < Kadıköy.Lat)
        +Right: Düğüm (Lat >= Kadıköy.Lat)
    }

    class ChildNode_Depth1_Left {
        <<Eksen: Longitude (Y)>>
        +Stop: Üsküdar
        +Left: Düğüm (Lon < Üsküdar.Lon)
        +Right: Düğüm (Lon >= Üsküdar.Lon)
    }

    class ChildNode_Depth1_Right {
        <<Eksen: Longitude (Y)>>
        +Stop: Bostancı
        +Left: Düğüm (Lon < Bostancı.Lon)
        +Right: Düğüm (Lon >= Bostancı.Lon)
    }

    RootNode_Depth0 --> ChildNode_Depth1_Left : Sol (Latitude Daha Küçük)
    RootNode_Depth0 --> ChildNode_Depth1_Right : Sağ (Latitude Daha Büyük)
```

## 4. K-Nearest Neighbors (KNN) Arama Akışı
KNN araması yapılırken KD-Tree ağacında mesafelerin nasıl hesaplanıp budama (pruning) yapıldığını gösteren aktivite/akış diyagramı.

```mermaid
flowchart TD
    A([Knn Metodu Başlar: Hedef Lat/Lon ve 'K' sayısı]) --> B{Ağaç Boş mu? \nveya K <= 0 mı?}
    B -- Evet --> C([Boş Liste Dön])
    B -- Hayır --> D(KnnSearch Başlat)
    
    D --> E{Node Null mu?}
    E -- Evet --> F([Geri Dön - Backtrack])
    
    E -- Hayır --> G(Hedef ile Node Arasındaki\nMesafeyi Hesapla)
    G --> H{Sonuç Listesi < K ?\nVEYA\nMesafe < Listedeki\nEn Büyük Mesafe ?}
    
    H -- Evet --> I(Node'u Sonuç Listesine Ekle/Güncelle\nve Mesafeye Göre Sırala)
    H -- Hayır --> J
    I --> J(Düğümün Eksenine Göre Hedef Değeri Karşılaştır)
    
    J --> K{Hedef, Node'dan Küçük mü?}
    K -- Evet --> L(Önce Sol Ağaca Git,\nSonra Sağ Ağaca)
    K -- Hayır --> M(Önce Sağ Ağaca Git,\nSonra Sol Ağaca)
    
    L --> N(Birinci Yöne Doğru Recursive KnnSearch)
    M --> N
    
    N --> O{Eksen Farkının Karesi <\nBulunan En Büyük Mesafe mi?}
    O -- Evet --> P(İkinci Yöne Doğru Recursive KnnSearch)
    O -- Hayır --> F
    
    P --> F
```
