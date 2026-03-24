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

export async function getWinePairingForDish(dishName: string, excludedWineries: string[] = []): Promise<WinePairing> {
  const response = await fetch("/api/gemini/pairing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dishName, excludedWineries }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get wine pairing");
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
    const error = await response.json();
    throw new Error(error.error || "Failed to generate video");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
