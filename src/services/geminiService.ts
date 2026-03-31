import { WineData, WinePairing } from "../types";

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      action: "extract", 
      payload: { base64Image, mimeType } 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to extract wine info");
  }
  return response.json();
}

export async function generateWineNotes(wineName: string): Promise<WineData> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      action: "notes", 
      payload: { wineName } 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate wine notes");
  }
  return response.json();
}

export async function getWinePairingForDish(dishName: string, excludedWineries: string[] = []): Promise<WinePairing> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      action: "pairing", 
      payload: { dishName, excludedWineries } 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get wine pairing");
  }
  return response.json();
}