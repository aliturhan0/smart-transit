# Akıllı Toplu Taşıma ve Navigasyon Sistemi

Bu proje, Veri Yapıları Dersi kapsamında geliştirilmiş, şehir içi toplu taşıma (metro, tramvay, otobüs) verileri üzerinde gerçek zamanlı navigasyon yapan yapay zeka destekli bir rota planlama sistemidir.

## Proje Mimarisi (Microservices)

Proje, 3 ayrı bileşenin (mikroservis) birbiriyle asenkron şekilde haberleşmesi üzerine kuruludur:

1. **Frontend (Nginx - Port 8888):** Vanilla JS, HTML ve CSS ile yazılmış, Canvas API kullanan yüksek performanslı harita görselleştiricisi.
2. **C# Backend (ASP.NET Core - Port 5099):** Projenin kalbi olan algoritmaların (Dijkstra, A*, KD-Tree, HashTable) çalıştığı ve verinin önbelleklendiği sunucu.
3. **AI Service (Python FastAPI - Port 8000):** C# Backend'den asenkron olarak çağrılan ve hesaplanan rotayı kullanarak yolcuya doğal dilde akıllı seyahat tavsiyeleri üreten mikroservis.

## Veri Yapıları ve Algoritmalar

- **KD-Tree:** Haritaya tıklandığında O(log N) hızında en yakın (KNN) durakların bulunması için kullanılmıştır.
- **HashTable:** Tüm durak ve hat erişimlerinin O(1) karmaşıklığında gerçekleşmesini sağlar. (Performans için C# Backend'de ve JS Map yapısı olarak Frontend'de)
- **Min-Heap (Priority Queue):** A* ve Dijkstra rotalama algoritmalarında, sıradaki ziyaret edilecek en kısa yollu düğümü logaritmik hızda çekmek için tasarlanmıştır.
- **Multigraph:** Duraklar arası bağlantıları temsil eden çoklu kenar destekli veri yapısı.

*(Not: Geliştirici imzaları ve Code Defense gereksinimleri `src/SmartTransit.Domain` altındaki `.cs` dosyalarında mevcuttur)*

## Sistemi Ayağa Kaldırmak (Docker)

Tüm sistem, bağımlılık sorunları yaşanmadan **tek bir komutla** ayağa kalkacak şekilde Dockerize edilmiştir.

### Ön Koşullar
- Sisteminize [Docker Desktop](https://www.docker.com/products/docker-desktop) kurulu ve çalışır durumda olmalıdır.

### Çalıştırma

Terminal veya komut istemcisinde (Command Prompt) projenin ana klasörüne gidin ve şu komutu çalıştırın:

```bash
docker compose up --build
```

Bu komut:
1. Python bağımlılıklarını kurar.
2. C# .NET 8 projesini restore edip derler.
3. Frontend dosyalarını Nginx içine taşır.

Konteynerler ayağa kalktıktan sonra tarayıcınızdan **http://localhost:8888** adresine giderek sistemi kullanabilirsiniz.
(C# Backend `localhost:5099`, Python AI servisi `localhost:8000` portunda çalışacaktır).
