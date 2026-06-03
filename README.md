<div align="center">
  <img src="https://raw.githubusercontent.com/aliturhan0/smart-transit/main/logo.png" alt="Logo" width="100" height="100">

  # 🚇 Smart Transit: Yapay Zeka Destekli Akıllı Toplu Taşıma Sistemi
  
  **Veri Yapıları ve Algoritmalar Dersi Final Projesi**

  [![Docker](https://img.shields.io/badge/Docker-Konteynerize-blue?logo=docker&logoColor=white)](https://www.docker.com/)
  [![C#](https://img.shields.io/badge/C%23-.NET%208%20Backend-512BD4?logo=c-sharp&logoColor=white)]()
  [![Python](https://img.shields.io/badge/Python-FastAPI%20AI%20Microservice-3776AB?logo=python&logoColor=white)]()
  [![JS](https://img.shields.io/badge/Vanilla_JS-Frontend-F7DF1E?logo=javascript&logoColor=black)]()
</div>

---

## 👥 Proje Ekibi (Grup 5)
Bu proje aşağıdaki ekip üyeleri tarafından tasarlanmış, geliştirilmiş ve kod savunması gereksinimlerine uygun olarak imza altına alınmıştır:

- **Ali Turhan** *(KD-Tree Geliştiricisi)*
- **Tuğçe Adışen** *(Dijkstra & HashTable Geliştiricisi)*
- **Mehmet Çetin** *(A-Star & TransitGraph Geliştiricisi)*

*(Ekip üyelerinin kod imzaları `src/SmartTransit.Domain` ve `src/SmartTransit.Infrastructure` klasörlerindeki ilgili C# dosyalarında bulunmaktadır).*

---

## 📖 Proje Raporu ve Özeti

**Smart Transit**, büyükşehirlerdeki karmaşık toplu taşıma ağlarını (Metro, Tramvay, Otobüs) matematiksel graf yapılarıyla modelleyen, hedef odaklı yönlendirme yapan ve bunu yapay zeka (LLM) asistanıyla destekleyen **mikroservis tabanlı** bir sistemdir. 

Jüri değerlendirme kriterlerinde (rubrik) istenen tüm detaylar bu sistemde baştan uca tasarlanmış ve optimize edilmiştir.

### 🌟 Öne Çıkan Teknik Özellikler
1. **Mikroservis (Eşzamanlılık):** Monolitik bir yapıdan kaçınılmış; veri işleyen C# sunucusu ile yapay zeka promptlarını yürüten Python sunucusu **asenkron olarak ayrı servisler halinde** çalıştırılmıştır.
2. **Konteynerizasyon:** Geliştirme ortamı farklılıklarını (Benim bilgisayarımda çalışıyordu problemini) ortadan kaldırmak için tüm altyapı Docker compose ile sarmalanmıştır.
3. **Milisaniyelik Render Performansı:** Ön yüzdeki (Frontend) harita çizim mekanizması, dizi arama (`O(n)`) maliyetinden kurtarılarak tamamen JavaScript `Map` objelerine (`O(1)`) geçirilmiş ve 60 FPS akıcı bir görselleştirme sağlanmıştır.

---

## 🏗️ Mimari ve Veri Yapıları Analizi

Projenin performansını belirleyen çekirdek veri yapıları C# backend üzerinde sıfırdan inşa edilmiştir.

### Zaman Karmaşıklığı (Big-O) Özeti
| Veri Yapısı / Algoritma | Görevi | Zaman Karmaşıklığı |
| :--- | :--- | :--- |
| **Hash Table** | O(1) hızında durak ve hat erişimi | `O(1)` ortalama |
| **KD-Tree** | Haritaya tıklandığında O(log N) KNN (K-Nearest) araması | `O(k * log N)` |
| **Min-Heap (Priority Queue)** | Yönlendirme algoritmalarında en kısa kenarın çekilmesi | `O(log V)` |
| **Dijkstra Rotalama** | BFS benzeri her yöne genişleyerek mutlak en kısa yol tespiti | `O((V+E) log V)` |
| **A* (A-Star) Rotalama** | Kuş uçuşu mesafe (Heuristik) tahminiyle hedef odaklı tarama | Pratik durumda **~%50** daha az düğüm ziyareti |

> 📚 **Detaylı Rapor:** Veri yapılarının analizinin detayları ve **Yapay Zeka Prompt dökümleri** için lütfen projedeki [**docs/big_o_analizi.md**](docs/big_o_analizi.md) dokümanını okuyunuz.

---

## 🧠 AI Servisi (Yapay Zeka Simülasyonu)

Sistem, hesaplanan C# rota sonucunu (Mesafe, Dakika, Aktarma Sayısı) bir "Prompt" metnine dönüştürür ve asenkron olarak Python FastAPI mikroservisine iletir. Bu servis, algoritmanın ham sonuçlarını analiz edip *"30 dakikalık uzun bir yolculuk, yanınıza kitap alabilirsiniz"* veya *"1 aktarmanız var, istasyonu kaçırmayın"* gibi insani ve akıllı tavsiyelere dönüştürerek kullanıcı arayüzüne geri besler.

---

## 🚀 Başlangıç ve Kurulum Rehberi

Projeyi (Docker sayesinde) tek tuşla ayağa kaldırmak çok kolaydır! Sisteminize ait adım adım kurulum rehberini okumak için lütfen aşağıdaki linke tıklayın:

👉 **[Tıklayın: KURULUM VE ÇALIŞTIRMA REHBERİ (KURULUM_REHBERI.md)](KURULUM_REHBERI.md)**

*(Proje terminalde `docker compose up --build` ile başlatılıp, tarayıcıda `http://localhost:8888` adresinden kullanılmaktadır).*
