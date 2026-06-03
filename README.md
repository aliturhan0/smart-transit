<div align="center">
  <img src="https://raw.githubusercontent.com/aliturhan0/smart-transit/main/logo.png" alt="Logo" width="120" height="120">

  # 🚇 Akıllı Toplu Taşıma ve Navigasyon Sistemi
  
  **Veri Yapıları ve Algoritmalar - Dönem Sonu Proje Raporu (Final)**

  [![Docker](https://img.shields.io/badge/Docker-Konteynerize-blue?logo=docker&logoColor=white)](https://www.docker.com/)
  [![C#](https://img.shields.io/badge/C%23-.NET%208%20Backend-512BD4?logo=c-sharp&logoColor=white)]()
  [![Python](https://img.shields.io/badge/Python-FastAPI%20AI%20Microservice-3776AB?logo=python&logoColor=white)]()
  [![JS](https://img.shields.io/badge/Vanilla_JS-Frontend-F7DF1E?logo=javascript&logoColor=black)]()
</div>

---

## 👥 Proje Geliştirme Ekibi (Grup 5)
Sistem mimarisi, veri yapıları kodlaması ve Code Defense (kod savunması) gereksinimleri doğrultusunda aşağıdaki ekip üyeleri tarafından geliştirilmiştir:
- **Ali Turhan:** Uzamsal Veri Yapıları (KD-Tree), Arayüz Geliştirme, Sistem Entegrasyonu
- **Tuğçe Adışen:** Veri Arama Algoritmaları (Hash Table), Dijkstra Rotalama Optimizasyonu
- **Mehmet Çetin:** Ağ Modellemesi (Multigraph), A* (A-Star) Algoritması, Heuristik Hesaplamalar

---

## 🎯 1. Senaryo ve Temel Amaç
Bu projenin temel senaryosu, büyük bir şehrin karmaşık toplu taşıma ağının (Metro, Tramvay, Otobüs) matematiksel bir model üzerinden incelenmesi ve kullanıcılara gerçek zamanlı navigasyon imkanı sunulmasıdır. 

Sistemde;
- **Duraklar (Stops):** Graf üzerindeki düğümler (Vertex)
- **Güzergahlar (Lines):** Duraklar arasındaki mesafe, süre ve hat bilgisi taşıyan kenarlar (Edge)
olarak modellenmiştir.

**Sistemin Temel Amaçları:**
1. Kullanıcının tıkladığı (bulunduğu) konuma en yakın durakları anında bulmak.
2. Karmaşık duraklar arası ağı "Graf" yapısı ile bilgisayar ortamında temsil etmek.
3. Seçilen iki nokta (Başlangıç ve Hedef) arasındaki en uygun rotayı hesaplamak.

---

## 🏗️ 2. Veri Yapıları Mimarisi (Faz 1)

Projede yüksek performans elde etmek amacıyla klasik diziler (Array/List) yerine gelişmiş veri yapıları C# dilinde sıfırdan implemente edilmiştir.

### 📍 2.1. Uzamsal Ağaç (KD-Tree / Spatial Tree)
- **Görevi:** Harita üzerinde herhangi bir (x, y) koordinatına en yakın $K$ adet durağı bulmak (KNN).
- **Maliyet / Performans:** Doğrusal tarama $O(N)$ yerine uzamsal düzlemi ikiye bölerek arama maliyetini **ortalama $O(\log N)$** seviyesine düşürür (En kötü durumda $O(N)$). 
- **Projedeki Yeri:** Ekrana tıklandığı milisaniye içinde binlerce durak arasından en yakınları tespit edilir.

### 🕸️ 2.2. Çoklu Graf (Multigraph)
- **Görevi:** Toplu taşıma ağını modellemek.
- **Detay:** İki durak arasında aynı anda hem Otobüs hem Metro hattı olabileceği için normal bir graf yerine *Multigraph* kullanılmış ve her kenara Mesafe, Süre ve Hat Rengi/Adı özellikleri atanmıştır.

### ⚡ 2.3. Karma Tablo (Hash Table)
- **Görevi:** Duraklara ve hatlara $O(1)$ yani anlık hızda erişmek.
- **Detay:** Durak ID'si verildiğinde durak bilgisine (Adı, Koordinatı), Hat ID'si verildiğinde o hattın güzergahına zincirleme gecikmesi olmadan hızlı erişim sağlar.

### 📉 2.4. Minimum Yığın (Min-Heap / Priority Queue)
- **Görevi:** Rota algoritmalarında (Dijkstra ve A*) sırada incelenecek en düşük maliyetli düğümü tutmak.
- **Maliyet / Performans:** Ekleme (Push) ve çıkarma (Pop) işlemleri algoritmaya **logaritmik zaman kazancı** ($O(\log N)$) sağlar.

---

## 🧮 3. Algoritmalar ve Yardımcı AI Kullanımı (Faz 2)

Sistemdeki matematiksel arama motoru iki ana algoritma ve onları tamamlayan bir AI modülü üzerinden çalışır:

1. **K-Nearest Neighbors (KNN):** KD-Tree üzerinde çalışarak farenin konumuna en yakın durakları anında bulur.
2. **Dijkstra Algoritması:** Graf üzerinde ağırlıklı en düşük maliyetli rotayı kesin olarak (BFS benzeri bir tarama ile) hesaplar.
3. **A* (A-Star) Algoritması (Optimizasyon):** Dijkstra'nın aksine hedefe körleme gitmez. Hedefe olan kuş uçuşu mesafeyi (Heuristic) hesaba katarak aramayı daraltır. Pratikte Dijkstra'dan %40-%60 daha az düğüm ziyaret eder.

### 🧠 Rota Maliyet Modeli ve Yapay Zeka (LLM) Entegrasyonu
Rota hesabı yapılırken sadece "Mesafe" değil, isteğe bağlı olarak "Süre" (En hızlı) veya "Aktarma Cezası" kriterleri devreye alınabilir.

**Yapay Zeka (AI) Asistanı:** 
C# tarafından hesaplanan rota (Süre, mesafe, aktarma sayısı), ayrı çalışan **Python FastAPI mikroservisine** iletilir. AI modülü, bu matamatiksel verileri kullanarak kullanıcıya *"1 aktarmanız var, 30 dakika sürecek, cam kenarına geçebilirsiniz"* tarzı doğal dilde bir tavsiye üretir.

---

## 🖥️ 4. Spesifik Arayüz ve Görselleştirme (Faz 3)

Frontend (Arayüz), kullanıcı deneyimini maksimize eden, sadeleştirilmiş bir Canvas harita sistemi üzerine kuruludur.

- **Konum Bazlı Arama:** Tıklanan noktaya en yakın duraklar turuncu hatlarla görsel olarak vurgulanır.
- **Rota Görselleştirme:** Başlangıç ve bitiş seçildiğinde, hesaplanan rota renkleriyle (Metro için mavi, Otobüs için yeşil) haritada çizilir. Aktarma noktaları özel yuvarlak pinlerle belirtilir.
- **Algoritma Karşılaştırması:** Hesaplama sonrasında ekranın sağında açılan sonuç panelinde, Dijkstra ve A* algoritmalarının çalışma süreleri, ziyaret ettikleri düğüm ve kenar sayıları bar grafikleriyle detaylı şekilde kapıştırılır.
- **Performans Optimizasyonu:** Orta ölçekli (sentetik veya gerçek) veri setlerinde kasma olmaması için sadece gerekli hatlar ve aktif duraklar (`O(1)` Hash erişimiyle) filtre edilerek render edilir. Haritaya Zoom ve Pan (Kaydırma) yetenekleri eklenmiştir.

---

## 🚀 Başlangıç ve Kurulum Rehberi (Docker)

Bu karmaşık yapı, jürilerin ve kullanıcıların bilgisayarlarında sorunsuz çalışması için baştan uca **Docker** ile konteynerize edilmiştir. Program kurmanıza gerek yoktur.

👉 **Lütfen projeyi çalıştırmak için [KURULUM_REHBERI.md](KURULUM_REHBERI.md) dosyasını okuyunuz.**

---
> *Bu proje, veri yapılarının ve modern mikroservis mimarisinin (C#, Python, JS) entegre şekilde kullanıldığı, yüksek performanslı bir mühendislik çalışmasıdır.*
