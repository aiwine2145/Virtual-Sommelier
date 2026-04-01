import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const action = req.method === 'POST' ? req.body.action : req.query.action;
  const payload = req.method === 'POST' ? req.body.payload : req.query;

  try {
    // ==========================================
    // 任務 1：圖片辨識
    // ==========================================
    if (action === 'extract') {
      const { base64Image, mimeType } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", 
        contents: {
          parts: [
            { text: `你是一位專業的侍酒師。請分析這張酒標圖片，辨識出這是哪一款酒。請絕對保持客觀，若缺少資訊填寫 "null"。` },
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
    // 任務 2：生成酒記 (GET，快取)
    // ==========================================
    if (action === 'notes') {
      const { wineName } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a master sommelier in Hong Kong. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".`,
        config: {
          temperature: 0.1, 
          systemInstruction: "You are an expert sommelier in Hong Kong. You MUST output ALL descriptions in authentic Hong Kong Cantonese.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wineName: { type: Type.STRING },
              vintage: { type: Type.STRING },
              region: { type: Type.STRING },
              countryCode: { type: Type.STRING },
              // 🌟 修改：精確指示 AI 尋找地圖的方法，並判定是酒莊還是產區
              mapSearchQuery: { type: Type.STRING, description: "Search query for Google Maps to find the EXACT winery (e.g., 'Château Lafite Rothschild, Pauillac'). ONLY use the region if the specific winery is completely unknown or generic." },
              mapLocationType: { type: Type.STRING, enum: ['winery', 'region'], description: "Classify if the mapSearchQuery points to a specific 'winery' or just a general 'region'." },
              estimatedPriceHKD: { type: Type.STRING, description: "Strictly format as 'HK$XXXX'. No ranges." },
              grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING, description: "Wine summary in Cantonese (粵語)." },
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
              rating: { type: Type.NUMBER, description: "Professional score strictly on a 100-point scale based on Authority -> Vivino Conversion -> Region/Price Estimate. DO NOT use a 1-10 scale." },
              decantingTime: { type: Type.STRING, description: "MUST be in Cantonese (粵語)." },
              // 🌟 修改：精確指示配餐數量與中菜比例
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide 4 to 6 highly curated food pairings in Cantonese (粵語). At least 1 or 2 MUST be classic Cantonese/Chinese dishes, but Chinese dishes must NOT exceed 50% of the list. Do not force 8 suggestions if 4-6 are perfect." }
            },
            required: ["wineName", "vintage", "region", "countryCode", "mapSearchQuery", "mapLocationType", "estimatedPriceHKD", "grapeVarieties", "description", "wineType", "tastingNotes", "analysis", "vintageNotes", "rating", "decantingTime", "foodPairings"]
          }
        }
      });
      const jsonStr = response.text?.trim() || "{}";
      
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate');
      }
      
      return res.status(200).json(JSON.parse(jsonStr));
    }

    // ==========================================
    // 任務 3：配餐推薦 (POST)
    // ==========================================
    if (action === 'pairing') {
      const { dishName, excludedWineries } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `你是一位常駐香港的頂級侍酒師。使用者會提供一道菜名，請你推薦幾款最適合搭配的葡萄酒。使用者輸入的菜色是：${dishName}。排除名單：${excludedWineries.join(', ')}。`,
        config: {
          temperature: 0.8, 
          systemInstruction: "You are a top sommelier based in Hong Kong. You MUST reply in JSON format.",
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
                    rating: { type: Type.NUMBER, description: "Professional score strictly on a 100-point scale based on Authority -> Vivino Conversion -> Region/Price Estimate." },
                    grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
                    decantingTime: { type: Type.STRING }
                  },
                  required: ["winery", "wine_name", "vintage", "reason", "wineType", "region", "countryCode", "estimatedPriceHKD", "rating", "grapeVarieties", "decantingTime"]
                }
              },
              refusalReason: { type: Type.STRING, description: "Refusal reason in Cantonese (粵語) if the dish is invalid." }
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