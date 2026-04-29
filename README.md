<div align="center">

# 🚇 Akıllı Toplu Taşıma ve Navigasyon Sistemi
## 📊 Veri Yapıları Projesi - Ara Rapor (Nisan 2026)

<img src="https://img.shields.io/badge/Durum-Ara_Rapor-orange?style=for-the-badge" alt="Ara Rapor"/>
<img src="https://img.shields.io/badge/Teslim_Tarihi-30.03.2026-blue?style=for-the-badge" alt="Tarih"/>

</div>

---

## 📝 Özet ve Mevcut Durum
Bu rapor, projenin ara teslim evresine kadar olan gelişimini, ekip içi iş bölümünü ve GitHub üzerindeki branch (şube) yönetimini belgelemektedir. Projenin temel algoritma altyapısı ve veri yapıları tamamlanmış olup, optimizasyon ve backend entegrasyon süreçlerine geçilmiştir.

---

## 👥 Ekip Çalışması ve Branch (Şube) Yönetimi
Proje, her özelliğin ayrı bir kolda geliştirildiği profesyonel bir iş akışına sahiptir. Aşağıda aktif olarak üzerinde çalışılan ve `main` şubesine entegre edilme aşamasında olan birimler listelenmiştir:

| Şube (Branch) | Sorumluluk Alanı / Veri Yapısı | Mevcut Durum |
|:--- |:--- |:--- |
| `feature/astar-iyilestirmeleri` | A* Algoritması Performans Optimizasyonu | ✅ Tamamlandı |
| `feature/csharp-astar-algoritmasi` | Backend Entegrasyonu (C# Porting) | 🚀 Yayında |
| `Dijkstra` | .NET 10 Tabanlı Profesyonel Mimari ve API | 🛠️ Geliştiriliyor |

---

## 🛠️ Teknik Bulgular ve Yapılan İyileştirmeler

### 1. Algoritma Optimizasyonu (A*)
*   **Problem:** Klasik A* algoritması büyük veri setlerinde her aramada tüm düğümleri başlattığı için yavaşlıyordu.
*   **Çözüm:** **Dynamic Initialization** (Dinamik Başlatma) ile sadece ziyaret edilen düğümlerin yönetilmesi sağlandı.
*   **İyileştirme:** **Tie-breaking Heuristic** eklenerek hedefe giden rotaların daha doğrusal ve estetik olması sağlandı.

### 2. Veri Yapıları ve Mimari Bulgular
*   **Multigraph Yapısı:** Aynı iki durak arasından geçen farklı hatların (Metro, Otobüs, Tramvay) verimli yönetimi için komşuluk listesi (adjacency list) tabanlı çoklu-graf yapısı stabilize edildi.
*   **Hata Yönetimi:** Geçersiz koordinat veya durak ID girişleri için **Guard Clause** mimarisi eklendi, uygulama çökmesi (runtime crash) engellendi.

### 3. Çoklu Dil ve Platform Desteği
*   Algoritma mantığının platform bağımsızlığını kanıtlamak amacıyla C# dilinde backend servisleri prototiplendi.
*   `src/` klasörü altında profesyonel **Domain-Driven Design (DDD)** altyapısı kuruldu.

---

## 🚀 Sonraki Adımlar
- [ ] Backend servislerinin frontend (Canvas API) ile tam entegrasyonu.
- [ ] Gerçek zamanlı araç simülasyonu optimizasyonu.
- [ ] Kullanıcı arayüzü (UI) final polish çalışmaları.

---

<div align="center">

**[GitHub Reposu Linki](https://github.com/aliturhan0/smart-transit.git)**
*Bu rapor Bilgisayar Mühendisliği Veri Yapıları dersi ara teslimi için hazırlanmıştır.*

</div>
