import { GoogleGenAI, Type } from "@google/genai";
import { Contact } from "../types";
import { v4 as uuidv4 } from 'uuid';

export const geminiService = {
  // 将非结构化文本解析为结构化联系人数据
  parseContactInfo: async (text: string): Promise<Omit<Contact, 'createdAt' | 'id'> | null> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following text and extract a single name and phone number.
                   Text: "${text}"
                   
                   Rules:
                   1. Name can be Chinese or English.
                   2. Phone number should be digits.
                   3. If multiple exist, take the first one.
                   4. If info is missing, return null.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The extracted name" },
              phone: { type: Type.STRING, description: "The extracted phone number" },
              isValid: { type: Type.BOOLEAN, description: "True if both name and phone were found" }
            },
            required: ["name", "phone", "isValid"]
          }
        }
      });

      const result = JSON.parse(response.text);

      if (result && result.isValid && result.name && result.phone) {
        return {
          name: result.name.substring(0, 20), // 强制限制 char name[21]
          phone: result.phone.substring(0, 15) // 强制限制 char phone[16]
        };
      }
      return null;
    } catch (error) {
      console.error("Gemini 解析错误:", error);
      return null;
    }
  }
};