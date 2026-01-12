
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getSmartResponse = async (userMessage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: "أنت مساعد ذكي في تطبيق دردشة عربي يدعى Z-Chat. رد بإيجاز وبطريقة ودودة. إذا طلب المستخدم المساعدة في ميزات التطبيق، اشرح له كيفية تثبيت الرسائل أو حذفها أو إجراء مكالمات فيديو.",
      },
    });
    return response.text || "عذراً، لم أستطع فهم ذلك.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، حدث خطأ في الاتصال بالمساعد الذكي.";
  }
};
