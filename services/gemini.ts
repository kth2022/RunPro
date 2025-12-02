import { GoogleGenAI, Type } from "@google/genai";
import { Record, Shoe, TrainingPlanItem } from "../types";

let ai: GoogleGenAI | null = null;
const modelId = "gemini-2.5-flash";

export const geminiService = {
  initialize(apiKey: string) {
    if (!apiKey) {
      ai = null;
      return;
    }
    ai = new GoogleGenAI({ apiKey });
  },

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const tempAi = new GoogleGenAI({ apiKey });
      await tempAi.models.generateContent({
        model: modelId,
        contents: "Test connection",
      });
      return true;
    } catch (error) {
      console.error("Connection Test Failed:", error);
      return false;
    }
  },

  async analyzeRunningData(records: Record[]): Promise<string> {
    if (!ai) return "API Key가 설정되지 않았습니다. 우측 상단 설정(⚙️) 버튼을 눌러 키를 등록해주세요.";
    try {
      if (records.length === 0) return "데이터 부족: 분석할 러닝 기록이 없습니다.";
      
      const recentRecords = records.slice(0, 5);
      const prompt = `
        너는 전문 러닝 코치야. 나의 최근 러닝 기록 데이터를 분석해줘.
        기록 데이터: ${JSON.stringify(recentRecords)}
        
        분석 내용:
        1. 페이스와 거리의 변화 추이
        2. 심박수(있는 경우)를 통한 운동 강도 평가
        3. 칭찬과 구체적인 개선점 1가지
        
        답변은 한국어로, 친절한 '해요체'로 3~4줄로 요약해서 작성해줘.
      `;
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });
      return response.text || "분석 결과를 불러올 수 없습니다.";
    } catch (error) {
      console.error("AI Error:", error);
      return "AI 분석 중 오류가 발생했습니다. API Key를 확인해주세요.";
    }
  },

  async askCoach(question: string): Promise<string> {
    if (!ai) return "API Key가 설정되지 않았습니다. 우측 상단 설정(⚙️) 버튼을 눌러 키를 등록해주세요.";
    try {
      const prompt = `
        너는 전문 러닝 코치야. 러너인 내가 다음 질문을 했어:
        "${question}"
        
        이 질문에 대해 전문적이고 실용적인 답변을 한국어로 3줄 이내로 해줘. 친절하고 격려하는 말투를 사용해.
      `;
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });
      return response.text || "답변을 불러올 수 없습니다.";
    } catch (error) {
      console.error("AI Error:", error);
      return "AI 연결 중 오류가 발생했습니다. API Key를 확인해주세요.";
    }
  },

  async getRecoveryAdvice(lastRecord: Record): Promise<string> {
    if (!ai) return "API Key가 설정되지 않았습니다. 우측 상단 설정(⚙️) 버튼을 눌러 키를 등록해주세요.";
    try {
      const prompt = `
        나의 가장 최근 러닝 기록이야:
        - 거리: ${lastRecord.distance}km
        - 시간: ${lastRecord.time}
        - 평균 심박수: ${lastRecord.avgHr || '정보 없음'}
        
        이 운동 직후에 섭취하면 좋은 음식(탄수화물, 단백질 종류)과 오늘 하루 권장되는 회복 방법(스트레칭, 휴식, 폼롤러 등)을 
        한국어로 3줄 이내로 간결하고 구체적으로 조언해줘. 영양사나 트레이너 톤으로 부탁해.
      `;
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });
      return response.text || "조언을 불러올 수 없습니다.";
    } catch (error) {
        console.error("AI Error:", error);
        return "AI 연결 중 오류가 발생했습니다. API Key를 확인해주세요.";
    }
  },

  async getGearAdvice(shoes: Shoe[]): Promise<string> {
    if (!ai) return "API Key가 설정되지 않았습니다. 우측 상단 설정(⚙️) 버튼을 눌러 키를 등록해주세요.";
    try {
      const prompt = `
        내 러닝화 리스트야: ${JSON.stringify(shoes)}.
        
        각 신발의 마일리지 상태와 종류를 분석해서:
        1. 현재 나의 로테이션 전략에 대한 짧은 평가
        2. 다음 러닝(가벼운 조깅 vs 템포런) 때 추천하는 신발
        3. 교체가 시급하거나 관리가 필요한 신발이 있다면 경고
        
        한국어로 3~4줄로 요약해서 조언해줘.
      `;
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });
      return response.text || "조언을 불러올 수 없습니다.";
    } catch (error) {
        console.error("AI Error:", error);
        return "AI 연결 중 오류가 발생했습니다. API Key를 확인해주세요.";
    }
  },

  async generateTrainingPlan(durationWeeks: number, goal: string, freq: number): Promise<TrainingPlanItem[]> {
    if (!ai) throw new Error("API Key가 설정되지 않았습니다. 우측 상단 설정(⚙️) 버튼을 눌러 키를 등록해주세요.");
    try {
      const prompt = `
        Role: Professional Running Coach.
        Task: Create a ${durationWeeks}-week running training plan for a goal of "${goal}".
        Frequency: ${freq} days per week.
        
        Generate a JSON array of training sessions. 
        Each object should have:
        - dayOffset (integer, 0 is start date)
        - type ("distance" or "interval")
        - targetDist (number, km)
        - targetPace (string, e.g. "6:00")
        - note (string, Korean, short description)
        - intervalDetails (null or object with sets, workDist, restTime)
      `;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayOffset: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: ["distance", "interval"] },
                targetDist: { type: Type.NUMBER },
                targetPace: { type: Type.STRING },
                note: { type: Type.STRING },
                intervalDetails: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    sets: { type: Type.INTEGER },
                    workDist: { type: Type.INTEGER },
                    restTime: { type: Type.INTEGER },
                  }
                }
              }
            }
          }
        }
      });
      
      let jsonText = response.text || "[]";
      
      // Robust extraction of JSON array using regex
      const jsonArrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        jsonText = jsonArrayMatch[0];
      }
      
      const parsed = JSON.parse(jsonText);
      // Ensure the result is an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("AI Plan Error:", error);
      throw new Error("AI 스케줄 생성 중 오류가 발생했습니다. API Key를 확인해주세요.");
    }
  }
};