<div align="center">

# 🚇 Akıllı Toplu Taşıma ve Navigasyon Sistemi
## 📊 Veri Yapıları Projesi - Ara Rapor (Nisan 2026)

<img src="https://img.shields.io/badge/Durum-Ara_Rapor-orange?style=for-the-badge" alt="Ara Rapor"/>
<img src="https://img.shields.io/badge/Teslim_Tarihi-30.04.2026-blue?style=for-the-badge" alt="Tarih"/>

</div>

---

## 📝 Özet ve Mevcut Durum
Bu rapor, projenin ara teslim evresine kadar olan gelişimini, ekip içi iş bölümünü ve GitHub üzerindeki branch (şube) yönetimini belgelemektedir. Projenin temel algoritma altyapısı ve veri yapıları tamamlanmış olup, optimizasyon ve backend entegrasyon süreçlerine geçilmiştir.

---

## 👥 Ekip Çalışması ve Branch (Şube) Yönetimi
Proje, ekip üyelerinin uzmanlık alanlarına göre ayrıldığı profesyonel bir iş akışına sahiptir. Aşağıda ekip üyelerinin kendi branch'ları üzerindeki çalışmaları listelenmiştir:

| Ekip Üyesi | Şube (Branch) | Sorumluluk Alanı / Çalışma | Durum |
|:--- |:--- |:--- |:--- |
| **Ali Turhan** | `main` | Proje İskeleti, UI Tasarımı ve Veri Entegrasyonu | ✅ Yayında |
| **Mehmet Çetin** | `feature/astar-iyilestirmeleri` | A* Algoritması Performans ve Tie-breaking Optimizasyonu | ✅ Tamamlandı |
| **Mehmet Çetin** | `feature/csharp-astar-algoritmasi` | Algoritmanın C# / Backend Porting Çalışmaları | 🚀 Yayında |
| **Tuğçe Adışen** | `Dijkstra` | .NET 10 Backend Mimarisi, Domain Modeli ve API | 🛠️ Geliştiriliyor |

---

## 🛠️ Teknik Bulgular ve Yapılan İyileştirmeler

### 1. Algoritma Optimizasyonu (Mehmet Çetin)
*   **Bulgu:** Klasik A* algoritması büyük veri setlerinde her aramada tüm düğümleri başlattığı için yavaşlıyordu.
*   **Çözüm:** **Dynamic Initialization** ile sadece ziyaret edilen düğümlerin yönetilmesi sağlandı.
*   **İyileştirme:** **Tie-breaking Heuristic** eklenerek hedefe giden rotaların daha doğal ve doğrusal olması sağlandı.

### 2. Backend Mimarisi ve API (Tuğçe Adışen)
*   **Mimari:** Projenin gelecekteki ölçeklenebilirliği için **Domain-Driven Design (DDD)** prensiplerine uygun bir .NET 10 altyapısı kuruldu.
*   **Algoritma:** Dijkstra algoritması, C#'ın yüksek performanslı `PriorityQueue` veri yapısı kullanılarak backend tarafında stabilize edildi.

### 3. Sistem Entegrasyonu ve Stabilite (Ali Turhan)
*   **Veri Yapısı:** Durakların uzaysal araması için **KD-Tree** yapısı optimize edildi ve milisaniye altı arama sürelerine ulaşıldı.
*   **Hata Yönetimi:** Çalışma zamanı hatalarını önlemek için tüm veri akışına **Guard Clause** mimarisi entegre edildi.

---

## 🚀 Sonraki Adımlar
- [ ] Backend servislerinin frontend (Canvas API) ile tam entegrasyonu.
- [ ] Gerçek zamanlı araç simülasyonu optimizasyonu.
- [ ] Kullanıcı arayüzü (UI) final polish çalışmaları.

---

<div align="center">

**[GitHub Reposu Linki](https://github.com/aliturhan0/smart-transit.git)**
*Bu rapor Bilgisayar Mühendisliği Veri Yapıları dersi ara teslimi için 30.04.2026 tarihinde hazırlanmıştır.*

</div>
