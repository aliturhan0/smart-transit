<div align="center">
  <img src="https://raw.githubusercontent.com/aliturhan0/smart-transit/main/logo.png" alt="Logo" width="120" height="120">

  # 🚇 Akıllı Toplu Taşıma ve Navigasyon Sistemi
  
  **Veri Yapıları Dersi - Dönem Sonu Proje Raporu (Final)**

  [![Docker](https://img.shields.io/badge/Docker-Konteynerize-blue?logo=docker&logoColor=white)](https://www.docker.com/)
  [![C#](https://img.shields.io/badge/C%23-.NET%208%20Backend-512BD4?logo=c-sharp&logoColor=white)]()
  [![Python](https://img.shields.io/badge/Python-FastAPI%20AI%20Microservice-3776AB?logo=python&logoColor=white)]()
  [![JS](https://img.shields.io/badge/Vanilla_JS-Frontend-F7DF1E?logo=javascript&logoColor=black)]()
</div>

---

## 👥 Proje Geliştirme Ekibi (Grup 5)
- **Ali Turhan:** Uzamsal Veri Yapıları , K-Nearest Neighbors (KNN) Algoritması, Graf Modelleme, Arayüz Geliştirme , Docker Sistem Entegrasyonu
- **Tuğçe Adışen:** Veri Arama Algoritmaları, Dijkstra Rotalama Optimizasyonu
- **Mehmet Çetin:** Ağ Modellemesi, A* (A-Star) Algoritması, Heuristik Hesaplamalar

---

## 🎯 1. Projenin Amacı ve Temel Senaryosu

Günümüz büyükşehirlerinde toplu taşıma ağları (metro, tramvay ve otobüs hatları) oldukça karmaşık bir yapıdadır. Yolcuların bir noktadan diğerine gitmek için hangi hatları kullanacaklarını, nerede aktarma yapacaklarını ve yolculuğun ne kadar süreceğini bilmeleri zordur.

**Akıllı Toplu Taşıma Sistemi** projesi, bu devasa şehir ağını sadeleştirilmiş bir matematiksel model (Graf) üzerinden ele alarak, yolculara akıllı ve optimize edilmiş seyahat rotaları sunmayı amaçlar.

Sistemimiz; durakları birer **nokta (düğüm)**, aralarındaki hatları ise süre ve mesafe bilgisi taşıyan **bağlantılar (kenar)** olarak kabul eder. Bu sayede harita üzerinde yapılan tıklamalar anında algılanarak en mantıklı rota çizilir.

---

## 🚀 2. Projenin Kapsamı ve Geliştirilen Özellikler

Sistemimiz sadece arka planda çalışan matematiksel bir modelden ibaret değildir; kullanıcıyla doğrudan etkileşime giren, zengin ve dinamik bir arayüze (Frontend) sahiptir.

### 📍 Dinamik Harita ve Konum Keşfi
- **Etkileşimli Harita:** Kullanıcılar harita üzerinde istedikleri yere Zoom yapabilir (yakınlaşabilir) ve haritayı sürükleyerek (Pan) şehri gezebilirler.
- **En Yakın Durakları Bulma (KNN):** Haritada rastgele boş bir noktaya tıklandığında, sistem o bölgeye en yakın durakları anında bulur ve turuncu renkli kesik çizgilerle ekranda vurgular.

### 🗺️ Akıllı Rota Hesaplama ve Görselleştirme
- **Detaylı Güzergah Çizimi:** Başlangıç ve bitiş noktası seçildiğinde sistem rotayı hesaplar. Seçilen rota harita üzerinde boyanır. (Örn: Metro hatları mavi, otobüs hatları yeşil).
- **Aktarma Noktaları:** Yolcunun araç değiştirmesi gereken istasyonlar özel ikonlarla haritada işaretlenir.
- **Filtreleme ve Optimizasyon:** Rotayı hesaplarken kullanıcının tercihine göre "En Kısa Mesafe" veya "En Hızlı Süre" kriterleri seçilebilir. Ayrıca aktarma yapmanın getirdiği zaman kaybı (Aktarma Cezası) kullanıcının inisiyatifine bırakılmıştır.

### 🤖 Yapay Zeka (AI) Seyahat Asistanı
Projemizi sıradan bir harita uygulamasından ayıran en büyük özellik, **kendi mikroservisine sahip bir Yapay Zeka Asistanı** içermesidir.
- Yolcunun rotası belli olduğunda, arka planda çalışan Python AI Servisi devreye girer.
- Toplam süre, mesafe ve aktarma bilgileri doğrultusunda sistem yolcuya doğal dilde tavsiyeler üretir.
- Örneğin: *"30 dakikalık uzun bir metro yolculuğunuz var, yanınıza kitap almanızı tavsiye ederiz"* veya *"1 aktarmanız bulunuyor, ineceğiniz durağı kaçırmamaya dikkat edin."*

---

## 🛠️ 3. Arka Plan Mimarisi (Nasıl Çalışıyor?)

Kullanıcının saniyeler içinde gördüğü bu akıcı deneyim, arka planda C# ile sıfırdan geliştirilmiş çok güçlü veri yapıları ve mikroservis mimarisine dayanmaktadır. 

---
> *Bu proje, veri yapılarının ve modern mikroservis mimarisinin (C#, Python, JS) entegre şekilde kullanıldığı, yüksek performanslı bir mühendislik çalışmasıdır.*

**Sürüm:** v1.0.0 (Final) 

1. **Uzamsal Ağaç (KD-Tree):** Haritada tıklanan bir noktaya en yakın durakları bulmak için tüm durakları tek tek aramak (doğrusal tarama) sistemi yavaşlatır. Bu yüzden veriler bir uzamsal ağaçta tutulur ve arama işlemi anında (logaritmik hızda) sonuçlanır.
2. **Karma Tablolar (Hash Table):** Durakların ve hatların bilgilerine, tıpkı bir sözlükten kelime bulur gibi anında (O(1) hızında) erişilir.
3. **Graf ve Yönlendirme Algoritmaları:** Şehir ağı bir **Multigraph** olarak tasarlanmıştır. Hedefe giden en kısa yolu bulmak için dünyaca ünlü **Dijkstra** ve **A* (A-Star)** algoritmaları kullanılmıştır.

### 🧩 Veri Yapıları UML ve Akış Diyagramları
Projenin temelini oluşturan özgün veri yapılarının mimarisi ve birbirleriyle ilişkisi:

#### 1. Genel Sınıf Diyagramı (Class Diagram)
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

#### 2. Graph (Çizge) Veri Yapısı Detayı
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

#### 3. KD-Tree Uzaysal Ağaç Yapısı
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

#### 4. K-Nearest Neighbors (KNN) Arama Akışı
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

### 📊 Algoritma Karşılaştırma Modülü
Kullanıcı bir rota oluşturduğunda, arayüzün sağ tarafında bir istatistik paneli açılır. Bu panelde Dijkstra ve A* algoritmalarının bu rotayı bulmak için ne kadar uğraştığı (kaç düğüm ziyaret ettikleri, kaç milisaniye harcadıkları) bar grafikleriyle karşılaştırmalı olarak kullanıcıya gösterilir. A*'ın sezgisel (kuş uçuşu) tahmin yeteneği sayesinde çoğu zaman Dijkstra'dan çok daha az işlem yaparak aynı sonuca ulaştığı görsel olarak kanıtlanır.

---

## 🔌 4. Tek Tıkla Kurulum ve Docker Desteği

Farklı bilgisayarlarda yaşanan "bende çalışıyordu, sende neden bozuldu" sorunlarının önüne geçmek için tüm projemizi **Docker** mimarisiyle paketledik. 

Projenin C# Backend, Python AI Servisi ve Javascript Frontend arayüzü birbirinden izole konteynerler (mini sunucular) halinde tek bir komutla çalışmaktadır. Kurulumla uğraşmadan sistemi denemek için aşağıdaki rehbere göz atabilirsiniz:

👉 **[Tıklayın: KURULUM VE ÇALIŞTIRMA REHBERİ (KURULUM_REHBERI.md)](KURULUM_REHBERI.md)**

---

<div align="right">
  <sub>🎥 Proje Sunum Videosu: <a href="https://youtu.be/vOyaaWRLBZE">YouTube Üzerinden İzleyin</a></sub>
</div>
