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
If unknown, provide generic examples. 
CRITICAL RULE: ALL descriptions MUST be in authentic Cantonese (粵語白話文). Use terms like '士多啤梨' (strawberry), '車厘子' (cherry), '黑加侖子' (blackcurrant), '單寧' (tannin). Do NOT use standard written Chinese.
Food Pairing Rules: Max 8 high-quality suggestions. Prioritize Cantonese/Chinese cuisine.
Analysis Rules: You MUST score the 5 analysis attributes (acidity, sweetness, body, complexity, balance) strictly on a scale of 1 to 10. For example, a dry red wine like Lafite should have very low sweetness (e.g., 1-2).`,
        config: {
          systemInstruction: "You are an expert sommelier in Hong Kong. Your tone is elegant and informative. You MUST output ALL descriptions, notes, and pairing suggestions in fluent Cantonese (Traditional Chinese, 粵語白話文).",
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
              description: { type: Type.STRING, description: "A short, elegant summary of the wine's character in Cantonese (粵語白話文)." },
              wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
              tastingNotes: {
                type: Type.OBJECT,
                properties: {
                  appearance: { type: Type.STRING, description: "Visual characteristics in Cantonese (粵語白話文)." },
                  aroma: { type: Type.STRING, description: "Olfactory characteristics in Cantonese (粵語白話文)." },
                  palate: { type: Type.STRING, description: "Taste characteristics in Cantonese (粵語白話文)." },
                  finish: { type: Type.STRING, description: "The length and nature of the aftertaste in Cantonese (粵語白話文)." }
                },
                required: ["appearance", "aroma", "palate", "finish"]
              },
              analysis: {
                type: Type.OBJECT,
                description: "A numerical analysis of the wine's characteristics on a strict scale of 1 to 10.",
                properties: {
                  acidity: { type: Type.NUMBER, description: "Acidity level (strictly 1-10)" },
                  sweetness: { type: Type.NUMBER, description: "Sweetness level (strictly 1-10). Dry wines should be 1-2." },
                  body: { type: Type.NUMBER, description: "Body/Weight level (strictly 1-10)" },
                  complexity: { type: Type.NUMBER, description: "Complexity level (strictly 1-10)" },
                  balance: { type: Type.NUMBER, description: "Overall balance level (strictly 1-10)" }
                },
                required: ["acidity", "sweetness", "body", "complexity", "balance"]
              },
              vintageNotes: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['specific', 'general'] },
                  year: { type: Type.STRING },
                  description: { type: Type.STRING, description: "Description of the vintage performance in Cantonese (粵語白話文)." }
                },
                required: ["type", "description"]
              },
              rating: { type: Type.NUMBER },
              decantingTime: { type: Type.STRING, description: "Recommended decanting time in Cantonese (粵語白話文)." },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Food pairing suggestions in Cantonese (粵語白話文)." }
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
d. 排除名單：請絕對不要推薦以下酒莊/品牌的酒款：${excludedWineries.join(', ')}。
CRITICAL RULE: The recommendation reasons MUST be written in authentic Cantonese (粵語白話文).`,
        config: {
          systemInstruction: "You are a top sommelier based in Hong Kong. You MUST reply in JSON format. The 'reason' field MUST be written in authentic Cantonese (Traditional Chinese, 粵語白話文).",
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
                    reason: { type: Type.STRING, description: "Recommendation reason in Cantonese (粵語白話文)." },
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
              refusalReason: { type: Type.STRING, description: "Refusal reason in Cantonese (粵語白話文) if the dish is invalid." }
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