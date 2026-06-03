from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import time
import random

app = FastAPI(title="Smart Transit AI Service")

class RouteSegment(BaseModel):
    lineName: str
    lineColor: str
    stops: List[int]
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

@app.post("/api/ai/analyze", response_model=AiResponse)
async def analyze_route(req: AiRequest):
    start_time = time.time()
    
    # 1. Prompt Hazırlığı (Rubrik: "AI API'sine gönderilen prompt'ların dökümü")
    lines_used = ", ".join([seg.lineName for seg in req.segments])
    
    prompt = f"""Sen akıllı bir toplu taşıma asistanısın.
Kullanıcı '{req.startStopName}' durağından '{req.endStopName}' durağına gitmek istiyor.
Bu yolculuk toplam {req.totalMinutes:.1f} dakika sürecek ve {req.totalDistance:.0f} metre mesafe kat edilecek.
Kullanılacak hatlar: {lines_used}. Toplam aktarma sayısı: {req.transfers}.
Lütfen yolcuya bu rota hakkında doğal dilde kısa, pratik ve dostane bir tavsiye ver."""

    # 2. Mock LLM Cevabı (Gerçek bir API key gerektirmeden çalışması için)
    # Burada normalde Google Gemini API veya OpenAI API çağrılırdı.
    
    comments = []
    if req.transfers == 0:
        comments.append("Harika bir haber, aktarma yapmadan tek vasıtayla doğrudan hedefinize ulaşacaksınız!")
    elif req.transfers == 1:
        comments.append(f"Yolculuğunuz sırasında 1 kez aktarma yapmanız gerekiyor. {req.segments[0].lineName} hattından inince diğer aracı kaçırmamaya dikkat edin.")
    else:
        comments.append(f"Bu rotada {req.transfers} aktarma var, biraz yorucu olabilir ama en kısa süre bu şekilde hesaplandı.")
        
    if req.totalMinutes > 30:
        comments.append("Yolculuk biraz uzun sürecek, yanınıza okuyacak bir şeyler almanızı tavsiye ederim.")
    else:
        comments.append("Kısa ve rahat bir yolculuk olacak.")
        
    if "Metro" in lines_used:
        comments.append("Metro hatları trafiğe takılmadığı için genellikle hesaplanan süreye tam uyar.")
    
    # Mock AI Gecikmesi simülasyonu
    time.sleep(random.uniform(0.3, 0.8))
    
    ai_comment = " ".join(comments) + "\n\n(Not: Bu mesaj asenkron Python mikroservisinden üretilmiştir.)"
    
    exec_time = (time.time() - start_time) * 1000
    
    return AiResponse(
        prompt_used=prompt,
        ai_comment=ai_comment,
        execution_time_ms=round(exec_time, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
