import { Config, Context } from "@netlify/functions";

export const config: Config = {
  path: "/.netlify/functions/gemini/*"
};

export default async function handler(req: Request, context: Context) {
  const url = new URL(req.url);
  // The path will be something like "/.netlify/functions/gemini/extract"
  const subPath = url.pathname.replace("/.netlify/functions/gemini", "");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();

    // Route handling
    if (subPath === "/extract") {
      return await handleExtract(body, apiKey);
    } else if (subPath === "/notes") {
      return await handleNotes(body, apiKey);
    } else if (subPath === "/pairing") {
      return await handlePairing(body, apiKey);
    } else if (subPath === "/video") {
      return await handleVideo(body, apiKey);
    } else if (subPath === "/chat") {
      return await handleChat(body, apiKey);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Function error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleExtract(body: any, apiKey: string) {
  const { base64Image, mimeType } = body;
  const prompt = `你是一位專業的侍酒師。請分析這張酒標圖片，綜合酒標上的圖案、Logo、排版與文字，辨識出這是哪一款酒。
請絕對保持客觀，不要編造圖片中沒有的資訊。如果圖片模糊或缺少某項資訊，請在該欄位填寫 "null"。
你必須且只能以 JSON 格式輸出結果，不要包含任何其他解釋性文字。

請忽略進口商、容量、警告標語等無關資訊，只提取能用於精準搜尋的核心酒名、酒莊與年份。如果酒標上沒有明確名稱，請根據視覺特徵推斷最可能的酒莊與酒款。

請根據以下 JSON 格式回傳資料：

{
  "winery": "酒莊名稱",
  "wine_name": "酒款名稱",
  "vintage": "年份，請填寫四位數字。若無年份請填寫 null",
  "grape_variety": "葡萄品種。若無標示請填寫 null",
  "region": "產區",
  "country": "生產國家"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          winery: { type: "STRING" },
          wine_name: { type: "STRING" },
          vintage: { type: "STRING" },
          grape_variety: { type: "STRING" },
          region: { type: "STRING" },
          country: { type: "STRING" },
        },
      },
    },
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" }
  });
}

async function handleNotes(body: any, apiKey: string) {
  const { wineName } = body;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `You are a master sommelier. Provide detailed tasting notes, rating, and food pairings for: "${wineName}".
Include vintage performance/recommendations, estimated price in HKD (750ml), and recommended decanting time (if none, state '無需醒酒').
If unknown, provide generic examples.
Language: Cantonese (Traditional Chinese).

Food Pairing Rules:
- Max 8 high-quality suggestions.
- Prioritize Cantonese/Chinese cuisine.
- Cantonese/Chinese pairings must not exceed 50% of total suggestions.`,
          },
        ],
      },
    ],
    generationConfig: {
      systemInstruction: {
        parts: [{ text: "You are an expert sommelier with deep knowledge of wine regions, grape varieties, tasting profiles, and food pairings. Your tone is elegant, informative, and passionate about wine. You must reply in Cantonese (Traditional Chinese, 粵語白話文)." }]
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          wineName: { type: "STRING" },
          vintage: { type: "STRING" },
          region: { type: "STRING" },
          countryCode: { type: "STRING" },
          mapSearchQuery: { type: "STRING" },
          estimatedPriceHKD: { type: "STRING" },
          grapeVarieties: { type: "ARRAY", items: { type: "STRING" } },
          description: { type: "STRING" },
          wineType: { type: "STRING", enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
          tastingNotes: {
            type: "OBJECT",
            properties: {
              appearance: { type: "STRING" },
              aroma: { type: "STRING" },
              palate: { type: "STRING" },
              finish: { type: "STRING" },
            },
            required: ["appearance", "aroma", "palate", "finish"],
          },
          analysis: {
            type: "OBJECT",
            properties: {
              acidity: { type: "NUMBER" },
              sweetness: { type: "NUMBER" },
              body: { type: "NUMBER" },
              complexity: { type: "NUMBER" },
              balance: { type: "NUMBER" }
            },
            required: ["acidity", "sweetness", "body", "complexity", "balance"]
          },
          vintageNotes: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ['specific', 'general'] },
              year: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["type", "description"]
          },
          rating: { type: "NUMBER" },
          decantingTime: { type: "STRING" },
          foodPairings: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["wineName", "vintage", "region", "countryCode", "mapSearchQuery", "estimatedPriceHKD", "grapeVarieties", "description", "wineType", "tastingNotes", "analysis", "vintageNotes", "rating", "decantingTime", "foodPairings"],
      },
    },
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" }
  });
}

async function handlePairing(body: any, apiKey: string) {
  const { dishName, excludedWineries } = body;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `你是一位常駐香港的頂級侍酒師。使用者會提供一道菜名，請你推薦幾款最適合搭配的葡萄酒。

1. 檢查菜式：若使用者輸入的菜式不存在、不合理或不道德，請拒絕提供推薦，並在 \`refusalReason\` 欄位說明理由。

2. 若菜式有效，請推薦 3 款最適合搭配的葡萄酒，條件如下：
   a. 搜尋範圍：必須是在以下香港本地葡萄酒網店及零售店能夠購買到的酒款。搜尋範圍包括：
      RNG Wine, Wine Couple, W Cellar, Wine Time, Remfly, Lyndhurst Wine, Wine Century Hong Kong, Vivino HK, Wines Buddy, Wine Wine, WineView, Watson's Wine, Two More Glasses, Ponti wine, Myicellar, Wine rack。
   b. 酒款選擇：不限於知名酒款，即使是冷門、小眾或特殊產區的酒款皆可。請盡量推薦不同種類的酒款（例如：一款紅酒、一款白酒、一款氣泡酒）。**請務必確保推薦的酒款具有多樣性，避免重複推薦相同的酒款。**
   c. 匹配度：要求極高，只推薦與該菜式「高度合適」的酒款。
   d. **排除名單**：請絕對不要推薦以下酒莊/品牌的酒款：${(excludedWineries || []).join(', ')}。

請提供具體的酒莊 (winery)、酒款名稱 (wine_name)、建議年份 (vintage)、推薦搭配理由 (reason)、酒類類型 (wineType)、產區 (region)、國家代碼 (countryCode)、預估價格 (estimatedPriceHKD)、評分 (rating，請提供 0-100 的專業評分)、葡萄品種 (grapeVarieties) 以及建議醒酒時間 (decantingTime)。

請以 JSON 格式回傳。推薦理由 (reason) 請使用粵語白話文表達，酒名與酒莊名稱請保持原文。

使用者輸入的菜色是：${dishName}`,
          },
        ],
      },
    ],
    generationConfig: {
      systemInstruction: {
        parts: [{ text: "You are a top sommelier based in Hong Kong. You provide expert, highly accurate wine pairing recommendations for dishes, focusing on wines available in the Hong Kong market. Provide 3 distinct recommendations of different types if possible. If the dish is invalid, unreasonable, or unethical, refuse to provide a recommendation and explain why in the 'refusalReason' field. You must reply in JSON format. The 'reason' field must be written in Cantonese (Traditional Chinese, 粵語白話文), while keeping wine names and winery names in their original language." }]
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          recommendations: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                winery: { type: "STRING" },
                wine_name: { type: "STRING" },
                vintage: { type: "STRING" },
                reason: { type: "STRING" },
                wineType: { type: "STRING", enum: ['red', 'white', 'sparkling', 'champagne', 'rose', 'sweet', 'fortified', 'other'] },
                region: { type: "STRING" },
                countryCode: { type: "STRING" },
                estimatedPriceHKD: { type: "STRING" },
                rating: { type: "NUMBER" },
                grapeVarieties: { type: "ARRAY", items: { type: "STRING" } },
                decantingTime: { type: "STRING" }
              },
              required: ["winery", "wine_name", "vintage", "reason", "wineType", "region", "countryCode", "estimatedPriceHKD", "rating", "grapeVarieties", "decantingTime"]
            }
          },
          refusalReason: { type: "STRING" }
        }
      },
    },
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
  const { type } = body;
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

  // Video generation via REST is more complex because it's an LRO.
  // We'll use the same logic as server.ts but adapted for fetch.
  const genResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:generateVideos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        videoConfig: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      }),
    }
  );

  let operation = await genResponse.json();
  if (!genResponse.ok) throw new Error(operation.error?.message || "Video generation failed");

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const pollResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/operations/${operation.name}`,
      {
        headers: { "x-goog-api-key": apiKey }
      }
    );
    operation = await pollResponse.json();
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Failed to generate video");

  const videoResponse = await fetch(downloadLink, {
    headers: { "x-goog-api-key": apiKey }
  });

  const buffer = await videoResponse.arrayBuffer();
  return new Response(buffer, {
    headers: { "Content-Type": "video/mp4" }
  });
}

async function handleChat(body: any, apiKey: string) {
  const { messages, systemInstruction } = body;
  
  const payload = {
    contents: messages,
    generationConfig: {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    }
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
