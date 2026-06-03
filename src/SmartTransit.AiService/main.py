from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Optional
import time
import random

app = FastAPI(title="Smart Transit AI Service")

class RouteSegment(BaseModel):
    lineName: str
    lineColor: str
    stops: List[str]
    duration: float
    distance: float

class AiRequest(BaseModel):
    startStopName: str
    endStopName: str
    totalMinutes: float
    totalDistance: float
    transfers: int
    segments: List[RouteSegment]

class AiResponse(BaseModel):
    prompt_used: str
    ai_comment: str
    execution_time_ms: float

@app.post("/api/ai/analyze")
async def analyze_route(request: Request):
    try:
        raw_body = await request.json()
        print("RAW BODY:", raw_body)
        req = AiRequest(**raw_body)
    except Exception as e:
        print("VALIDATION ERROR:", e)
        return {"ai_comment": f"Error: {e}", "execution_time_ms": 0}
        
    start_time = time.time()
    
    # 1. Prompt Hazırlığı (Rubrik: "AI API'sine gönderilen prompt'ların dökümü")
    lines_used = ", ".join([seg.lineName for seg in req.segments])
    
    prompt = f"""Sen akıllı bir toplu taşıma asistanısın.
Kullanıcı '{req.startStopName}' durağından '{req.endStopName}' durağına gitmek istiyor.
Bu yolculuk toplam {req.totalMinutes:.1f} dakika sürecek ve {req.totalDistance:.0f} metre mesafe kat edilecek.
Kullanılacak hatlar: {lines_used}. Toplam aktarma sayısı: {req.transfers}.
Lütfen yolcuya bu rota hakkında doğal dilde kısa, pratik ve dostane bir tavsiye ver."""

    # 2. Mock LLM Cevabı (Çeşitlendirilmiş Asistan)
    import random
    comments = []
    
    # Aktarma Senaryoları
    if req.transfers == 0:
        no_transfer_msgs = [
            "Harika bir haber! Aktarma yapmadan, tek vasıtayla rahatça hedefinize ulaşacaksınız.",
            "Şanslısınız, doğrudan giden bir hat buldum. Gevşeyin ve yolculuğun tadını çıkarın.",
            f"Hiç aktarma yapmanıza gerek yok. {req.segments[0].lineName} hattı sizi doğrudan hedefinize götürecek."
        ]
        comments.append(random.choice(no_transfer_msgs))
    elif req.transfers == 1:
        one_transfer_msgs = [
            f"Yolculuğunuz sırasında 1 kez araç değiştireceksiniz. {req.segments[0].lineName} hattından inince tabelaları takip etmeyi unutmayın.",
            "Küçük bir aktarmamız var. İlk araçtan indikten sonra diğer hatta geçerken eşyalarınızı unutmayın lütfen.",
            f"Bu rotada 1 aktarma mevcut. İlk olarak {req.segments[0].lineName} ile başlayıp sonra diğer hatta geçiş yapacağız."
        ]
        comments.append(random.choice(one_transfer_msgs))
    else:
        many_transfer_msgs = [
            f"Bu rotada {req.transfers} aktarma var, biraz yorucu olabilir ancak sistemin bulduğu en mantıklı seçenek bu.",
            f"Şehir içinde {req.transfers} kez araç değiştireceğiz. Aktarma noktalarında kalabalıklara dikkat edin.",
            f"Birkaç aktarmamız olacak ({req.transfers} kez). Ama merak etmeyin, en hızlı varış için optimize edilmiş bir rota kullanıyoruz."
        ]
        comments.append(random.choice(many_transfer_msgs))
        
    # Süre Senaryoları
    if req.totalMinutes > 30:
        long_msgs = [
            "Yolculuk biraz uzun sürecek, yanınıza okuyacak bir şeyler veya kulaklığınızı almanızı tavsiye ederim.",
            "Uuzun bir seyahat olacak. Cam kenarına geçip podcast dinlemek için harika bir fırsat!",
            "Yolculuğunuz yarım saati geçecek, telefonunuzun şarjının dolu olduğundan emin olun."
        ]
        comments.append(random.choice(long_msgs))
    else:
        short_msgs = [
            "Kısa ve pratik bir yolculuk olacak.",
            "Hemen varıyoruz, bence ayakta kalsanız da pek yorulmazsınız.",
            "Göz açıp kapayıncaya kadar hedefinize varmış olacaksınız!"
        ]
        comments.append(random.choice(short_msgs))
        
    # Araç Tipi Eklemeleri
    if "Metro" in lines_used:
        metro_msgs = [
            "Metro hatları trafiğe takılmadığı için planlanan süreye tam uyacaktır.",
            "Metronun hız avantajını kullanarak trafik stresinden uzak bir yolculuk yapacaksınız."
        ]
        comments.append(random.choice(metro_msgs))
    
    # Mock AI Gecikmesi simülasyonu
    time.sleep(random.uniform(0.3, 0.8))
    
    ai_comment = " ".join(comments)
    
    exec_time = (time.time() - start_time) * 1000
    
    return AiResponse(
        prompt_used=prompt,
        ai_comment=ai_comment,
        execution_time_ms=round(exec_time, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
