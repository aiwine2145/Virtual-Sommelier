import { WineData, WinePairing } from "../types";

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetch("/api/gemini/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract wine info");
  }

  return response.json();
}

export async function generateWineNotes(wineName: string): Promise<WineData> {
  const response = await fetch("/api/gemini/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wineName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate wine notes");
  }

  return response.json();
}

export async function* getWinePairingForDish(dishName: string, excludedWineries: string[] = []): AsyncGenerator<string> {
  // 精準設定為 /api/chat，Netlify 會根據 netlify.toml 轉發至 functions
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // 傳遞 JSON body，包含 prompt
    body: JSON.stringify({ 
      prompt: `你是一位專業的侍酒師。請為這道菜式推薦 3 款最適合搭配的葡萄酒：${dishName}。請使用粵語白話文回答，並詳細說明原因。請確保推薦的酒款在香港市場可以買到。`,
      systemInstruction: "你是一位專業的香港侍酒師。請用粵語白話文回答使用者的任何關於葡萄酒、配餐或品酒的問題。語氣要專業、優雅且熱情。"
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start pairing stream");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 使用 TextDecoder 解析串流資料塊
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        if (dataStr === "[DONE]") continue;
        try {
          const data = JSON.parse(dataStr);
          // 提取 Gemini 回傳的文字內容，達成打字機效果
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      }
    }
  }
}

export async function generateWineCategoryVideo(type: string): Promise<string> {
  const response = await fetch("/api/gemini/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate video");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function* chatStream(messages: any[], systemInstruction?: string): AsyncGenerator<string> {
  // 精準設定為 /api/chat，Netlify 會根據 netlify.toml 轉發至 functions
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // 傳遞 JSON body，包含對話紀錄與系統指令
    body: JSON.stringify({ messages, systemInstruction }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start chat stream");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 使用 TextDecoder 解析串流資料塊
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        if (dataStr === "[DONE]") continue;
        try {
          const data = JSON.parse(dataStr);
          // 提取 Gemini 回傳的文字內容，達成打字機效果
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      }
    }
  }
}
