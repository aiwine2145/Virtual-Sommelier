import { GoogleGenAI, Type } from "@google/genai";
import { WineData } from "../types";

// 為了同時支援 Netlify 部署 (Vite) 與 AI Studio 本地預覽
const viteEnv = (import.meta as any).env;
const apiKey = (viteEnv && viteEnv.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const ai = new GoogleGenAI({ apiKey: apiKey as string });

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `你是一位專業的葡萄酒侍酒師與資料萃取專家。你的任務是精準分析使用者上傳的酒標圖片，並萃取出關鍵的葡萄酒資訊。
請絕對保持客觀，不要編造圖片中沒有的資訊。如果圖片模糊或缺少某項資訊，請在該欄位填寫 "null"。
你必須且只能以 JSON 格式輸出結果，不要包含任何其他解釋性文字。

請分析這張酒標圖片，並根據以下 JSON 格式回傳資料：

{
  "winery": "酒莊名稱 (例如：Penfolds, Concha y Toro)",
  "wine_name": "酒款名稱 (例如：Bin 389, Casillero del Diablo)",
  "vintage": "年份，請填寫四位數字 (例如：2018)。若無年份請填寫 null",
  "grape_variety": "葡萄品種 (例如：Cabernet Sauvignon, Merlot)。若無標示請填寫 null",
  "region": "產區 (例如：Bordeaux, Napa Valley)",
  "country": "生產國家"
}

重要指示：請嚴格且僅以 JSON 格式輸出結果，不要包含任何 Markdown 標記（例如不要寫 \`\`\`json ），也不要加入任何問候語或解釋性文字。`
        }
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
  return JSON.parse(jsonStr);
}

export async function generateWineNotes(wineName: string): Promise<WineData> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `You are a master sommelier. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".
Include vintage performance/recommendations, estimated price in HKD (750ml), and recommended decanting time (if none, state '無需醒酒').
If unknown, provide generic examples.
Language: Cantonese (Traditional Chinese).

Food Pairing Rules:
- Max 8 high-quality suggestions.
- Prioritize Cantonese/Chinese cuisine.
- Cantonese/Chinese pairings must not exceed 50% of total suggestions.`,
    config: {
      systemInstruction: "You are an expert sommelier with deep knowledge of wine regions, grape varieties, tasting profiles, and food pairings. Your tone is elegant, informative, and passionate about wine. You must reply in Cantonese (Traditional Chinese, 粵語白話文).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wineName: {
            type: Type.STRING,
            description: "The full name of the wine, including producer and cuvée.",
          },
          vintage: {
            type: Type.STRING,
            description: "The vintage year, or 'NV' for non-vintage.",
          },
          region: {
            type: Type.STRING,
            description: "The wine region and country (e.g., 'Bordeaux, France').",
          },
          countryCode: {
            type: Type.STRING,
            description: "The 2-letter ISO 3166-1 alpha-2 country code for the wine's country of origin (e.g., 'FR' for France, 'IT' for Italy, 'US' for USA).",
          },
          mapSearchQuery: {
            type: Type.STRING,
            description: "The best search query to find the exact winery location on Google Maps (e.g., 'Château Lafite Rothschild, Pauillac, France'). If the specific winery is unknown or generic, provide the region instead (e.g., 'Pauillac, Bordeaux, France').",
          },
          estimatedPriceHKD: {
            type: Type.STRING,
            description: "The Wine-Searcher retail price in Hong Kong Dollars (HKD) for a standard 750ml bottle. Prefer Hong Kong price, fallback to Global Average price converted to HKD. Format as 'HK$XXX (750ml)'. If unknown, provide a best estimate or '價格不詳'.",
          },
          grapeVarieties: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "The grape varieties used in the wine.",
          },
          description: {
            type: Type.STRING,
            description: "A short, elegant summary of the wine's character in Cantonese.",
          },
          wineType: {
            type: Type.STRING,
            description: "The general category of the wine.",
            enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other']
          },
          tastingNotes: {
            type: Type.OBJECT,
            properties: {
              appearance: {
                type: Type.STRING,
                description: "Visual characteristics (color, clarity, viscosity).",
              },
              aroma: {
                type: Type.STRING,
                description: "Olfactory characteristics (primary, secondary, tertiary aromas).",
              },
              palate: {
                type: Type.STRING,
                description: "Taste characteristics (sweetness, acidity, tannin, alcohol, body, flavor intensity).",
              },
              finish: {
                type: Type.STRING,
                description: "The length and nature of the aftertaste.",
              },
            },
            required: ["appearance", "aroma", "palate", "finish"],
          },
          analysis: {
            type: Type.OBJECT,
            description: "A numerical analysis of the wine's characteristics on a scale of 1 to 10.",
            properties: {
              acidity: { type: Type.NUMBER, description: "Acidity level (1-10)" },
              sweetness: { type: Type.NUMBER, description: "Sweetness level (1-10)" },
              body: { type: Type.NUMBER, description: "Body/Weight level (1-10)" },
              complexity: { type: Type.NUMBER, description: "Complexity level (1-10)" },
              balance: { type: Type.NUMBER, description: "Overall balance level (1-10)" }
            },
            required: ["acidity", "sweetness", "body", "complexity", "balance"]
          },
          vintageNotes: {
            type: Type.OBJECT,
            description: "Information about the vintage performance.",
            properties: {
              type: {
                type: Type.STRING,
                description: "Whether the notes are for a specific vintage ('specific') or general excellent vintages ('general').",
                enum: ['specific', 'general']
              },
              year: {
                type: Type.STRING,
                description: "The specific year if applicable, otherwise omit or leave empty."
              },
              description: {
                type: Type.STRING,
                description: "Description of the vintage performance in that region, or a list of excellent vintages in Cantonese."
              }
            },
            required: ["type", "description"]
          },
          rating: {
            type: Type.NUMBER,
            description: "A professional rating score out of 100.",
          },
          decantingTime: {
            type: Type.STRING,
            description: "Recommended decanting time in Cantonese (e.g., '30-60 分鐘' or '無需醒酒').",
          },
          foodPairings: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "Specific and complementary food pairing suggestions.",
          },
        },
        required: [
          "wineName",
          "vintage",
          "region",
          "countryCode",
          "mapSearchQuery",
          "estimatedPriceHKD",
          "grapeVarieties",
          "description",
          "wineType",
          "tastingNotes",
          "analysis",
          "vintageNotes",
          "rating",
          "decantingTime",
          "foodPairings",
        ],
      },
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as WineData;
}

export async function generateWineCategoryVideo(type: string): Promise<string> {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  const ai = new GoogleGenAI({ apiKey: apiKey as string });

  const prompts: Record<string, string> = {
    'red': 'A cinematic close-up slow motion shot of a red wine bottle with a completely blank white label, no text or images, standing on a dark wooden table in a dimly lit cellar. Elegant lighting.',
    'white': 'A cinematic close-up slow motion shot of a white wine bottle with a completely blank white label, no text or images, condensation on the glass, standing on a bright marble counter.',
    'sparkling': 'A cinematic close-up slow motion shot of a sparkling wine bottle with a completely blank gold label, no text or images, fine bubbles visible inside, elegant setting.',
    'champagne': 'A cinematic close-up slow motion shot of a champagne bottle with a completely blank silver label, no text or images, being placed in an ice bucket, luxury atmosphere.',
    'rose': 'A cinematic close-up slow motion shot of a rose wine bottle with a completely blank pinkish label, no text or images, outdoors in a sunny garden setting.',
    'sweet': 'A cinematic close-up slow motion shot of a dessert wine bottle with a completely blank label, no text or images, golden liquid, small elegant bottle.',
    'fortified': 'A cinematic close-up slow motion shot of a fortified wine bottle with a completely blank dark label, no text or images, rich dark liquid, classic study room setting.'
  };

  const prompt = prompts[type.toLowerCase()] || 'A cinematic close-up shot of a wine bottle with a completely blank label, no text or images, elegant setting.';

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Failed to generate video");

  const videoResponse = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });

  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
}
