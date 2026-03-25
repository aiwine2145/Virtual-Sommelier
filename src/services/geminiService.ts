import { WineData, WinePairing } from "../types";

// ==========================================
// 1. 保留你原本的舊功能，避免 Vite 打包報錯
// ==========================================

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetch("/api/gemini/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(errorData.error || "Failed to extract wine info");
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
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(errorData.error || "Failed to generate wine notes");
  }

  return response.json();
}

export async function generateWineCategoryVideo(type: string): Promise<string> {
  const response = await fetch("/api/gemini/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(errorData.error || "Failed to generate video");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}


// ==========================================
// 2. 更新為 /api/chat 的全新串流功能 (解決 404 問題)
// ==========================================

export async function* getWinePairingForDish(dishName: string, excludedWineries: string[] = []) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt: `請以專業虛擬侍酒師的身份，為這道菜推薦配餐酒：${dishName}。請避開以下酒莊：${excludedWineries.join(', ')}。` 
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get wine pairing");
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") continue; 
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            yield textPart; 
          }
        } catch (e) {
          console.warn("解析 SSE 事件失敗", e, dataStr);
        }
      }
    }
  }
}

export async function* chatStream(messages: any[], systemInstruction: string) {
  const response = await fetch("/api/chat", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemInstruction }),
  });

  if (!response.ok) {
    throw new Error("Failed to chat");
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") continue;
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield data.candidates[0].content.parts[0].text;
          }
        } catch (e) {
          console.warn("Failed to parse SSE event", e);
        }
      }
    }
  }
}