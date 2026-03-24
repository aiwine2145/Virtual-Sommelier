import { WineData, WinePairing } from "../types";

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetch("/api/gemini/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as any;
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
    const errorData = (await response.json()) as any;
    throw new Error(errorData.error || "Failed to generate wine notes");
  }

  return response.json();
}

export async function getWinePairingForDish(dishName: string, excludedWineries: string[] = []): Promise<WinePairing> {
  const response = await fetch("/api/gemini/pairing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dishName, excludedWineries }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as any;
    throw new Error(errorData.error || "Failed to get wine pairing");
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
    const errorData = (await response.json()) as any;
    throw new Error(errorData.error || "Failed to generate video");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function* chatStream(messages: any[], systemInstruction: string) {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemInstruction }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as any;
    throw new Error(errorData.error || "Failed to chat");
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    // Parse SSE events
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield data.candidates[0].content.parts[0].text;
          }
        } catch (e) {
          console.error("Failed to parse SSE event", e);
        }
      }
    }
  }
}
