
import { GoogleGenAI, Type } from "@google/genai";
import { MedicationLog, AIAdvice } from "../types";

export const getAIHealthAdvice = async (
  medicineName: string,
  logs: MedicationLog[]
): Promise<AIAdvice> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Using default advice.");
    return { message: "记得按时吃药哦，祝您早日康复！", type: "encouragement" };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 记录是按照时间倒序排列的（最新的在前面），所以取前5条即为最近5条
  const historyString = logs.slice(0, 5).map(l => new Date(l.timestamp).toLocaleString()).join(', ');
  
  const prompt = `The user just took their medication: ${medicineName}. 
  Recent history: ${historyString}. 
  Provide a very short (max 15 words) encouraging message or a brief health tip in Chinese (since the user requested in Chinese).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            type: { 
              type: Type.STRING,
              enum: ['encouragement', 'info', 'warning']
            }
          },
          required: ['message', 'type']
        }
      }
    });

    const data = JSON.parse(response.text || '{"message": "太棒了，继续保持！", "type": "encouragement"}');
    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { message: "记得按时吃药哦，祝您早日康复！", type: "encouragement" };
  }
};
