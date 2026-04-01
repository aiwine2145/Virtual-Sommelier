import { WineData, WinePairing } from "../types";

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetch("/api/gemini", {
    method: "POST", // 看圖辨識維持 POST，不快取
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
  // 🌟 關鍵修改：將搜尋酒款改為 GET 請求，並透過 URL 傳遞參數，這樣 Vercel 才會幫我們免費快取！
  const params = new URLSearchParams({ action: "notes", wineName });
  const response = await fetch(`/api/gemini?${params.toString()}`, {
    method: "GET", 
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate wine notes");
  }
  return response.json();
}

export async function getWinePairingForDish(dishName: string, excludedWineries: string[] = []): Promise<WinePairing> {
  const response = await fetch("/api/gemini", {
    method: "POST", // 配餐維持 POST，繞過快取，保持多變創意
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