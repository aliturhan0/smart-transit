# 🚀 Smart Transit - Kurulum ve Çalıştırma Rehberi

Bu proje **Microservices (Mikroservis)** mimarisi kullanılarak geliştirilmiş ve **Docker** ile konteynerize edilmiştir. Bu sayede hiçbir programlama dili veya kütüphane kurmanıza gerek kalmadan, tek bir komutla tüm sistemi ayağa kaldırabilirsiniz.

---

## 📋 Sistem Gereksinimleri

Projenizi kendi bilgisayarınızda veya sunum yapacağınız hocanın bilgisayarında çalıştırmak için **sadece 1 adet** programa ihtiyacınız var:
- **[Docker Desktop](https://www.docker.com/products/docker-desktop)**

*(Not: Node.js, Python veya .NET SDK kurmanıza GEREK YOKTUR!)*

---

## 🛠️ Sistemi Başlatma (Tek Tıkla Kurulum)

1. **Projeyi Klasöre Çıkartın:**
   GitHub'dan indirdiğiniz veya zip'ten çıkardığınız `smart-transit` klasörünü açın.

2. **Terminali Açın:**
   Mac kullanıyorsanız `Terminal`, Windows kullanıyorsanız `CMD` veya `PowerShell` uygulamasını açın.

3. **Proje Dizinine Gidin:**
   Terminalde `cd` komutunu kullanarak projenin ana klasörüne gidin.
   Örnek: `cd Desktop/smart-transit`

4. **Sihirli Komutu Yazın:**
   Docker uygulamasının (sağ altta veya üstte balina ikonu) çalıştığından emin olduktan sonra terminale şu komutu yapıştırın ve Enter'a basın:
   ```bash
   docker compose up --build
   ```

**Bekleyin:** Bu komut çalıştığında sistem arkaplanda sizin için;
- Nginx Web Sunucusunu (Frontend)
- C# .NET 8 Backend API'sini
- Python FastAPI Yapay Zeka Servisini
ayrı ayrı indirecek, kuracak ve birbirine bağlayacaktır. (İlk kurulum internet hızınıza bağlı olarak birkaç dakika sürebilir).

---

## 🌐 Projeyi Kullanma

Terminal ekranında hata olmadığını ve servislerin ayağa kalktığını gördüğünüzde, en sevdiğiniz web tarayıcısını (Chrome, Safari vs.) açın ve adres çubuğuna şunu yazın:

👉 **http://localhost:8888**

İşte bu kadar! Göz alıcı arayüzüyle **Akıllı Toplu Taşıma Sistemi** karşınızda. Haritaya tıklayarak en yakın durakları bulabilir veya "Rota Hesapla" moduna geçerek Dijkstra ve A* algoritmalarını kapıştırabilirsiniz.

---

## 🛑 Sistemi Kapatma

Uygulamayı kapatmak istediğinizde, sistemi başlattığınız terminal penceresinde `CTRL + C` tuşlarına aynı anda basın. Docker sizin için tüm arka plan servislerini güvenlice temizleyip kapatacaktır.
