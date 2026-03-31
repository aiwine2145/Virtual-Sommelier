import { GoogleGenAI, Type } from "@google/genai";

// ⭐️ Vercel 專屬設定：將 Serverless Function 的超時時間延長至 60 秒
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const { action, payload } = req.body;

  try {
    // ==========================================
    // 任務 1：圖片辨識 (使用最強視覺模型 gemini-2.5-pro)
    // ==========================================
    if (action === 'extract') {
      const { base64Image, mimeType } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", 
        contents: {
          parts: [
            { text: `你是一位專業的侍酒師。請分析這張酒標圖片，綜合酒標上的圖案、Logo、排版與文字，辨識出這是哪一款酒。
請絕對保持客觀，不要編造圖片中沒有的資訊。如果圖片模糊或缺少某項資訊，請在該欄位填寫 "null"。
你必須且只能以 JSON 格式輸出結果，不要包含任何其他解釋性文字。
請忽略進口商、容量、警告標語等無關資訊，只提取能用於精準搜尋的核心酒名、酒莊與年份。如果酒標上沒有明確名稱，請根據視覺特徵推斷最可能的酒莊與酒款。` },
            { inlineData: { data: base64Image, mimeType: mimeType } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              winery: { type: Type.STRING, nullable: true },
              wine_name: { type: Type.STRING, nullable: true },
              vintage: { type: Type.STRING, nullable: true },
              grape_variety: { type: Type.STRING, nullable: true },
              region: { type: Type.STRING, nullable: true },
              country: { type: Type.STRING, nullable: true },
            }
          }
        }
      });
      const jsonStr = response.text?.trim() || "{}";
      return res.status(200).json(JSON.parse(jsonStr));
    }

    // ==========================================
    // 任務 2：生成酒記 (使用極速模型 gemini-2.5-flash)
    // ==========================================
    if (action === 'notes') {
      const { wineName } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a master sommelier. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".
Include vintage performance/recommendations, estimated price in HKD (750ml), and recommended decanting time (if none, state '無需醒酒').
If unknown, provide generic examples. Language: Cantonese (Traditional Chinese).
Food Pairing Rules: Max 8 high-quality suggestions. Prioritize Cantonese/Chinese cuisine. Cantonese/Chinese pairings must not exceed 50% of total suggestions.`,
        config: {
          systemInstruction: "You are an expert sommelier with deep knowledge of wine regions, grape varieties, tasting profiles, and food pairings. Your tone is elegant, informative, and passionate about wine. You must reply in Cantonese (Traditional Chinese, 粵語白話文).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wineName: { type: Type.STRING },
              vintage: { type: Type.STRING },
              region: { type: Type.STRING },
              countryCode: { type: Type.STRING },
              mapSearchQuery: { type: Type.STRING },
              estimatedPriceHKD: { type: Type.STRING },
              grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
              tastingNotes: {
                type: Type.OBJECT,
                properties: {
                  appearance: { type: Type.STRING },
                  aroma: { type: Type.STRING },
                  palate: { type: Type.STRING },
                  finish: { type: Type.STRING }
                },
                required: ["appearance", "aroma", "palate", "finish"]
              },
              analysis: {
                type: Type.OBJECT,
                properties: {
                  acidity: { type: Type.NUMBER },
                  sweetness: { type: Type.NUMBER },
                  body: { type: Type.NUMBER },
                  complexity: { type: Type.NUMBER },
                  balance: { type: Type.NUMBER }
                },
                required: ["acidity", "sweetness", "body", "complexity", "balance"]
              },
              vintageNotes: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['specific', 'general'] },
                  year: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["type", "description"]
              },
              rating: { type: Type.NUMBER },
              decantingTime: { type: Type.STRING },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["wineName", "vintage", "region", "countryCode", "mapSearchQuery", "estimatedPriceHKD", "grapeVarieties", "description", "wineType", "tastingNotes", "analysis", "vintageNotes", "rating", "decantingTime", "foodPairings"]
          }
        }
      });
      const jsonStr = response.text?.trim() || "{}";
      return res.status(200).json(JSON.parse(jsonStr));
    }

    // ==========================================
    // 任務 3：配餐推薦 (使用極速模型 gemini-2.5-flash)
    // ==========================================
    if (action === 'pairing') {
      const { dishName, excludedWineries } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `你是一位常駐香港的頂級侍酒師。使用者會提供一道菜名，請你推薦幾款最適合搭配的葡萄酒。
使用者輸入的菜色是：${dishName}。
若菜式有效，請推薦 3 款最適合搭配的葡萄酒，條件如下：
a. 搜尋範圍：香港本地葡萄酒網店及零售店。
b. 酒款選擇：盡量推薦不同種類的酒款。
c. 匹配度：要求極高。
d. 排除名單：請絕對不要推薦以下酒莊/品牌的酒款：${excludedWineries.join(', ')}。`,
        config: {
          systemInstruction: "You are a top sommelier based in Hong Kong. You provide expert, highly accurate wine pairing recommendations... You must reply in JSON format. The 'reason' field must be written in Cantonese.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    winery: { type: Type.STRING },
                    wine_name: { type: Type.STRING },
                    vintage: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
                    region: { type: Type.STRING },
                    countryCode: { type: Type.STRING },
                    estimatedPriceHKD: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
                    decantingTime: { type: Type.STRING }
                  },
                  required: ["winery", "wine_name", "vintage", "reason", "wineType", "region", "countryCode", "estimatedPriceHKD", "rating", "grapeVarieties", "decantingTime"]
                }
              },
              refusalReason: { type: Type.STRING }
            }
          }
        }
      });
      const jsonStr = response.text?.trim() || "{}";
      return res.status(200).json(JSON.parse(jsonStr));
    }

    return res.status(400).json({ error: 'Invalid action specified' });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}