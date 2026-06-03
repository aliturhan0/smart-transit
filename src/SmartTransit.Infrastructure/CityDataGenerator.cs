using System;
using System.Collections.Generic;
using SmartTransit.Domain;

namespace SmartTransit.Infrastructure
{
    public class CityLine
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string Color { get; set; }
        public double SpeedFactor { get; set; }
        public int[] Stops { get; set; }
    }

    public static class CityDataGenerator
    {
        public static (List<Stop> Stops, List<CityLine> Lines) GetData()
        {
            var stops = new List<Stop>
            {
                new Stop(1, "Cumhuriyet Meydanı", 500, 350),
                new Stop(2, "Belediye", 460, 320),
                new Stop(3, "Adliye", 540, 310),
                new Stop(4, "Çarşı", 480, 380),
                new Stop(5, "Kültür Merkezi", 530, 390),
                new Stop(6, "Üniversite", 420, 150),
                new Stop(7, "Kampüs", 380, 120),
                new Stop(8, "Teknoloji Vadisi", 460, 180),
                new Stop(9, "Araştırma Merkezi", 500, 140),
                new Stop(10, "Yurt", 350, 160),
                new Stop(11, "Sanayi", 450, 560),
                new Stop(12, "Organize Sanayi", 500, 590),
                new Stop(13, "Lojistik Merkez", 550, 570),
                new Stop(14, "Fabrikalar", 420, 600),
                new Stop(15, "Depo", 480, 620),
                new Stop(16, "Hastane", 700, 340),
                new Stop(17, "Poliklinik", 740, 300),
                new Stop(18, "Eczane Caddesi", 680, 370),
                new Stop(19, "Tıp Fakültesi", 760, 360),
                new Stop(20, "Acil", 720, 380),
                new Stop(21, "Terminal", 250, 350),
                new Stop(22, "Otogar", 200, 330),
                new Stop(23, "Park", 280, 380),
                new Stop(24, "Yeşil Alan", 230, 400),
                new Stop(25, "Spor Kompleksi", 300, 310),
                new Stop(26, "AVM", 650, 180),
                new Stop(27, "Sinema", 680, 210),
                new Stop(28, "Fuar Alanı", 620, 150),
                new Stop(29, "Kongre Merkezi", 700, 160),
                new Stop(30, "Otel Bölgesi", 660, 130),
                new Stop(31, "Havalimanı", 150, 120),
                new Stop(32, "Kargo", 180, 150),
                new Stop(33, "Uçak Bakım", 120, 100),
                new Stop(34, "Terminal 2", 190, 180),
                new Stop(35, "Otopark", 220, 140),
                new Stop(36, "Stadyum", 700, 520),
                new Stop(37, "Spor Salonu", 730, 490),
                new Stop(38, "Olimpik Havuz", 680, 550),
                new Stop(39, "Atletizm Pisti", 750, 540),
                new Stop(40, "Tribün", 720, 560),
                new Stop(41, "Konut Bölgesi", 250, 520),
                new Stop(42, "Site", 220, 550),
                new Stop(43, "Okul", 280, 490),
                new Stop(44, "Kreş", 200, 500),
                new Stop(45, "Mahalle Parkı", 260, 560),
                new Stop(46, "Köprü", 400, 280),
                new Stop(47, "Kavşak", 580, 280),
                new Stop(48, "Ring Durağı", 600, 420),
                new Stop(49, "Meydan", 380, 420),
                new Stop(50, "Bulvar", 350, 280),
                new Stop(51, "Pazar Yeri", 440, 440),
                new Stop(52, "Cami", 520, 440),
                new Stop(53, "Müze", 560, 250),
                new Stop(54, "Kütüphane", 440, 250),
                new Stop(55, "Postane", 600, 350),
                new Stop(56, "İtfaiye", 340, 450),
                new Stop(57, "Emniyet", 620, 470),
                new Stop(58, "Kaymakamlık", 480, 300),
                new Stop(59, "Valilik", 520, 340),
                new Stop(60, "Hükümet Konağı", 500, 280),
                new Stop(61, "Mezarlık", 850, 250),
                new Stop(62, "Su Arıtma", 100, 400),
                new Stop(63, "Enerji Santrali", 870, 450),
                new Stop(64, "Baraj", 900, 200),
                new Stop(65, "Orman Girişi", 130, 250),
                new Stop(66, "Piknik Alanı", 160, 300),
                new Stop(67, "Göl Kenarı", 880, 350),
                new Stop(68, "Çiftlik", 900, 550),
                new Stop(69, "Bağ Evi", 100, 550),
                new Stop(70, "Sahil", 500, 670),
                new Stop(71, "Tren Garı", 400, 350),
                new Stop(72, "Metro İstasyonu", 320, 340),
                new Stop(73, "Aktarma Merkezi", 560, 350),
                new Stop(74, "İş Merkezi", 640, 300),
                new Stop(75, "Plaza", 660, 260),
                new Stop(76, "Rezidans", 300, 430),
                new Stop(77, "Lise", 350, 500),
                new Stop(78, "İlkokul", 620, 530),
                new Stop(79, "Cezaevi", 850, 150),
                new Stop(80, "Askeri Bölge", 130, 500)
            };

            var lines = new List<CityLine>
            {
                new CityLine { Id = "M1", Name = "M1 Metro", Type = "metro", Color = "#3b82f6", SpeedFactor = 0.8, Stops = new[] { 22, 21, 72, 71, 2, 1, 59, 73, 55, 16, 17, 19 } },
                new CityLine { Id = "M2", Name = "M2 Metro", Type = "metro", Color = "#8b5cf6", SpeedFactor = 0.8, Stops = new[] { 9, 8, 60, 58, 1, 5, 52, 48, 57, 36, 38 } },
                new CityLine { Id = "T1", Name = "T1 Tramvay", Type = "tram", Color = "#f59e0b", SpeedFactor = 1.0, Stops = new[] { 31, 32, 35, 50, 46, 54, 58, 3, 47, 53, 75, 26, 29 } },
                new CityLine { Id = "B1", Name = "B1 Otobüs", Type = "bus", Color = "#10b981", SpeedFactor = 1.3, Stops = new[] { 7, 10, 6, 8, 54, 46, 2, 1, 3, 47, 74, 27, 26, 28 } },
                new CityLine { Id = "B2", Name = "B2 Otobüs", Type = "bus", Color = "#06b6d4", SpeedFactor = 1.3, Stops = new[] { 1, 4, 51, 49, 56, 76, 43, 41, 42, 45 } },
                new CityLine { Id = "B3", Name = "B3 Otobüs", Type = "bus", Color = "#ec4899", SpeedFactor = 1.3, Stops = new[] { 1, 5, 52, 48, 18, 20, 57, 78, 38, 40, 39 } },
                new CityLine { Id = "B4", Name = "B4 Otobüs", Type = "bus", Color = "#f97316", SpeedFactor = 1.3, Stops = new[] { 65, 66, 22, 24, 23, 21, 25, 50, 72, 71, 4, 51, 11, 14, 15 } },
                new CityLine { Id = "B5", Name = "B5 Otobüs", Type = "bus", Color = "#84cc16", SpeedFactor = 1.3, Stops = new[] { 29, 30, 79, 64, 61, 67, 19, 16, 18, 48, 57, 36, 37, 39, 63, 68 } },
                new CityLine { Id = "B6", Name = "B6 Otobüs", Type = "bus", Color = "#a855f7", SpeedFactor = 1.3, Stops = new[] { 71, 1, 59, 73, 55, 48, 13, 12, 11, 15, 70 } },
                new CityLine { Id = "B7", Name = "B7 Otobüs", Type = "bus", Color = "#14b8a6", SpeedFactor = 1.3, Stops = new[] { 33, 31, 62, 80, 69, 44, 42, 77, 56, 49, 4 } }
            };

            return (stops, lines);
        }

        public static TransitGraph BuildGraph(List<Stop> stops, List<CityLine> lines)
        {
            var graph = new TransitGraph();
            foreach (var stop in stops)
            {
                graph.AddStop(stop);
            }

            foreach (var line in lines)
            {
                for (int i = 0; i < line.Stops.Length - 1; i++)
                {
                    int fromId = line.Stops[i];
                    int toId = line.Stops[i + 1];

                    var fromStop = stops.Find(s => s.Id == fromId);
                    var toStop = stops.Find(s => s.Id == toId);

                    if (fromStop == null || toStop == null) continue;

                    double dx = fromStop.Latitude - toStop.Latitude;
                    double dy = fromStop.Longitude - toStop.Longitude;
                    double distance = Math.Sqrt(dx * dx + dy * dy);

                    double duration = (distance / 50.0) * line.SpeedFactor;

                    graph.AddEdge(new TransitEdge(fromId, toId, line.Id, Math.Round(duration, 1), Math.Round(distance, 0)));
                    graph.AddEdge(new TransitEdge(toId, fromId, line.Id, Math.Round(duration, 1), Math.Round(distance, 0)));
                }
            }

            return graph;
        }
    }
}
