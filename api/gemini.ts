import { GoogleGenAI, Type } from "@google/genai";

// ⭐️ Vercel 專屬設定：將 Serverless Function 的超時時間延長至 60 秒
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  // 允許 POST (圖片辨識、配餐) 與 GET (搜尋酒款快取)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 根據請求方法取得參數
  const action = req.method === 'POST' ? req.body.action : req.query.action;
  const payload = req.method === 'POST' ? req.body.payload : req.query;

  try {
    // ==========================================
    // 任務 1：圖片辨識 (POST，不快取)
    // ==========================================
    if (action === 'extract') {
      const { base64Image, mimeType } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", 
        contents: {
          parts: [
            { text: `你是一位專業的侍酒師。請分析這張酒標圖片，綜合酒標上的圖案、Logo、排版與文字，辨識出這是哪一款酒。
請絕對保持客觀，不要編造圖片中沒有的資訊。如果圖片模糊或缺少某項資訊，請在該欄位填寫 "null"。
你必須且只能以 JSON 格式輸出結果，不要包含任何其他解釋性文字。` },
            { inlineData: { data: base64Image, mimeType: mimeType } }
          ]
        },
        config: {
          temperature: 0.1,
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
    // 任務 2：生成酒記 (GET，自動快取 30 天)
    // ==========================================
    if (action === 'notes') {
      const { wineName } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a master sommelier in Hong Kong. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".
Include vintage performance/recommendations, and recommended decanting time.
CRITICAL RULE 1: ALL text fields MUST be in highly authentic Hong Kong Cantonese (純正香港粵語白話文). DO NOT use written Chinese (書面語). Use terms like '士多啤梨', '車厘子', '呢支酒', '好有層次'.
CRITICAL RULE 2 (PRICE): For estimatedPriceHKD, you MUST provide a single median price formatted exactly as 'HK$XXXX'. No ranges. Assume 750ml. If special capacity, add '(375ml)'.
Analysis Rules: Score acidity, sweetness, body, complexity, balance strictly on a scale of 1 to 10. Dry wines must have sweetness 1-2.`,
        config: {
          temperature: 0.1, 
          systemInstruction: "You are an expert sommelier in Hong Kong. You MUST output ALL descriptions, notes, and pairing suggestions in authentic Hong Kong Cantonese (粵語白話文).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wineName: { type: Type.STRING },
              vintage: { type: Type.STRING },
              region: { type: Type.STRING },
              countryCode: { type: Type.STRING },
              mapSearchQuery: { type: Type.STRING },
              estimatedPriceHKD: { type: Type.STRING, description: "Strictly format as 'HK$XXXX'. No ranges." },
              grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING, description: "Wine summary MUST be in Cantonese (粵語白話文)." },
              wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
              tastingNotes: {
                type: Type.OBJECT,
                properties: {
                  appearance: { type: Type.STRING, description: "Appearance MUST be in Cantonese (粵語)." },
                  aroma: { type: Type.STRING, description: "Aroma MUST be in Cantonese (粵語)." },
                  palate: { type: Type.STRING, description: "Palate MUST be in Cantonese (粵語)." },
                  finish: { type: Type.STRING, description: "Finish MUST be in Cantonese (粵語)." }
                },
                required: ["appearance", "aroma", "palate", "finish"]
              },
              analysis: {
                type: Type.OBJECT,
                description: "Analysis on a strict scale of 1 to 10.",
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
                  description: { type: Type.STRING, description: "MUST be in Cantonese (粵語)." }
                },
                required: ["type", "description"]
              },
              rating: { type: Type.NUMBER },
              decantingTime: { type: Type.STRING, description: "MUST be in Cantonese (粵語)." },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "MUST be in Cantonese (粵語)." }
            },
            required: ["wineName", "vintage", "region", "countryCode", "mapSearchQuery", "estimatedPriceHKD", "grapeVarieties", "description", "wineType", "tastingNotes", "analysis", "vintageNotes", "rating", "decantingTime", "foodPairings"]
          }
        }
      });
      const jsonStr = response.text?.trim() || "{}";
      
      // 🌟 Vercel 終極魔法：將這份結果在全球 CDN 快取 30 天 (2592000 秒)！
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate');
      }
      
      return res.status(200).json(JSON.parse(jsonStr));
    }

    // ==========================================
    // 任務 3：配餐推薦 (POST，不快取，高溫保持驚喜)
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
          temperature: 0.8, // 高溫
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