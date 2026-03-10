import { GoogleGenAI, Type } from "@google/genai";
import { WineData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWineNotes(wineName: string): Promise<WineData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a master sommelier. Provide detailed tasting notes, rating, and food pairings for the following wine: "${wineName}". If the user specifies a vintage, provide notes on how that specific vintage performed in that region. If the user does not specify a vintage, provide notes for a typical or recent vintage AND provide a list of excellent recent vintages for that region. If the input is not a real wine, politely explain that you cannot find it and provide a generic example instead. IMPORTANT: All your responses must be in Cantonese (Traditional Chinese, 粵語白話文).`,
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
            enum: ['red', 'white', 'sparkling', 'rose', 'sweet', 'fortified', 'other']
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
          "grapeVarieties",
          "description",
          "wineType",
          "tastingNotes",
          "vintageNotes",
          "rating",
          "foodPairings",
        ],
      },
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as WineData;
}
