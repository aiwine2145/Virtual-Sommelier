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
        contents: `You are a master sommelier in Hong Kong. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".
CRITICAL RULE 1: ALL descriptions MUST be in authentic Hong Kong Cantonese (純正香港粵語白話文).
CRITICAL RULE 2 (PRICE): Calculate the AVERAGE of the LOWEST available prices from Wine-Searcher and Vivino. Output the number only in 'price' (HKD) and the volume in 'capacity'.
CRITICAL RULE 3 (RATING): The overall 'rating' MUST be a 100-point scale score based on Authority -> Vivino Conversion -> Sommelier Estimate.
CRITICAL RULE 4 (VINTAGE): ALWAYS provide a list of excellent vintages for that wine's region and describe them (優秀年份推薦模式).
CRITICAL RULE 5 (DECANTING): Older vintages require LESS decanting time. Exceptions: highly tannic Italian wines.`,
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
              mapSearchQuery: { type: Type.STRING, description: "Search query for Google Maps to find the EXACT winery. ONLY use region if unknown." },
              mapLocationType: { type: Type.STRING, enum: ['winery', 'region'] },
              // 🌟 減壓策略一：價格與容量分開，讓前端排版
              price: { type: Type.NUMBER, description: "HKD Price (Number only)" },
              capacity: { type: Type.STRING, description: "e.g., 750ml, 375ml" },
              grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING, description: "摘要 (粵語)" }, // 🌟 減壓策略三：極簡化
              wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
              tastingNotes: {
                type: Type.OBJECT,
                properties: {
                  appearance: { type: Type.STRING, description: "外觀 (粵語)" },
                  aroma: { type: Type.STRING, description: "香氣 (粵語)" },
                  palate: { type: Type.STRING, description: "口感 (粵語)" },
                  finish: { type: Type.STRING, description: "餘韻 (粵語)" }
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
                  description: { type: Type.STRING, description: "優秀年份推薦 (粵語)" }
                },
                required: ["description"]
              },
              rating: { type: Type.NUMBER, description: "100-point scale" },
              decantingTime: { type: Type.STRING, description: "醒酒時間 (粵語)" },
              foodPairings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4-6項配餐, 包含1-2道中菜 (粵語)" }
            },
            required: ["wineName", "vintage", "region", "countryCode", "mapSearchQuery", "mapLocationType", "price", "capacity", "grapeVarieties", "description", "wineType", "tastingNotes", "analysis", "vintageNotes", "rating", "decantingTime", "foodPairings"]
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
        contents: `你是一位常駐香港的頂級侍酒師。使用者會提供一道菜名，請你推薦幾款最適合搭配的葡萄酒。使用者輸入的菜色是：${dishName}。排除名單：${excludedWineries.join(', ')}。
CRITICAL RULE 1: The recommendation reasons MUST be written in authentic Cantonese (粵語白話文).
CRITICAL RULE 2: Calculate the AVERAGE of the LOWEST available prices from Wine-Searcher and Vivino. Output the number only in 'price' (HKD) and the volume in 'capacity'.
CRITICAL RULE 3: For 'rating', provide a 100-point scale score based on Authority -> Vivino Conversion -> Region/Price Estimate.`,
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
                    reason: { type: Type.STRING, description: "推薦理由 (粵語)" },
                    wineType: { type: Type.STRING, enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
                    region: { type: Type.STRING },
                    countryCode: { type: Type.STRING },
                    price: { type: Type.NUMBER, description: "HKD Price (Number only)" },
                    capacity: { type: Type.STRING, description: "e.g., 750ml, 375ml" },
                    rating: { type: Type.NUMBER, description: "100-point scale" },
                    grapeVarieties: { type: Type.ARRAY, items: { type: Type.STRING } },
                    decantingTime: { type: Type.STRING, description: "醒酒時間 (粵語)" }
                  },
                  required: ["winery", "wine_name", "vintage", "reason", "wineType", "region", "countryCode", "price", "capacity", "rating", "grapeVarieties", "decantingTime"]
                }
              },
              refusalReason: { type: Type.STRING, description: "拒絕理由 (粵語)" }
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