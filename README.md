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

| Ekip Üyesi | Şube (Branch) | Sorumluluk Alanı / Çalışma Detayları | Durum |
|:--- |:--- |:--- |:--- |
| **Ali Turhan** | `main` | KD-Tree Uzaysal İndeksleme, Canvas API Görselleştirme, Sentetik Veri Üretici ve Proje Entegrasyonu | ✅ Yayında |
| **Tuğçe Adışen** | `Dijkstra` | DDD Mimari Kurulumu, .NET 10 PriorityQueue Tabanlı Dijkstra Implementasyonu ve API Geliştirme | 🛠️ Geliştiriliyor |
| **Mehmet Çetin** | `feature/csharp-astar-algoritmasi` | Algoritmanın C# / Backend Porting Çalışmaları ve Mantıksal Doğrulama | 🚀 Yayında |

---

## 🛠️ Teknik Bulgular ve Yapılan İyileştirmeler

### 1. Uzaysal Arama ve Görselleştirme (Ali Turhan)
*   **KD-Tree Optimizasyonu:** 80+ durak ve karmaşık koordinat düzleminde $O(log N)$ sürede en yakın komşu araması (KNN) yapabilen 2-boyutlu ağaç yapısı optimize edildi.
*   **Canvas API Entegrasyonu:** Büyük ölçekli graf yapılarını tarayıcıyı yormadan gerçek zamanlı render edebilen katmanlı görselleştirme motoru geliştirildi.
*   **Veri Yönetimi:** Multigraph yapısındaki (metro, otobüs, tramvay) çakışmaları önleyen `hash-table` tabanlı durak indeksleme sistemi kuruldu.

### 2. Kurumsal Backend Mimarisi ve Rota Planlama (Tuğçe Adışen)
*   **DDD (Domain-Driven Design):** Projenin genişleyebilirliği için `Domain`, `Application` ve `Infrastructure` katmanlarından oluşan kurumsal mimari kuruldu.
*   **Performanslı Dijkstra:** C# dilinin en yeni özelliklerinden biri olan `PriorityQueue<TElement, TPriority>` kullanılarak Dijkstra algoritması en verimli haliyle implement edildi.
*   **API Altyapısı:** Frontend ile iletişim kuracak olan RESTful API servislerinin veri modelleri ve routing yapıları tasarlandı.

### 3. Çoklu Dil ve Algoritma Taşınabilirliği (Mehmet Çetin)
*   JavaScript tarafındaki karmaşık rota maliyet modellerinin (aktarma cezası, yürüyüş mesafesi vb.) C# ortamına hatasız aktarımı sağlandı.

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
