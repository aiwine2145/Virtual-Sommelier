import { WineData, WinePairing } from "../types";

async function fetchWithRetry(fetcher: () => Promise<Response>, maxRetries = 2): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetcher();
    if (response.ok) return response;
    const errorData = await response.json().catch(() => ({}));
    const retryable = errorData.retryable || response.status === 503 || response.status === 504;
    if (!retryable || attempt === maxRetries) {
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw lastError;
}

export async function extractWineInfoFromImage(base64Image: string, mimeType: string): Promise<any> {
  const response = await fetchWithRetry(() => fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "extract",
      payload: { base64Image, mimeType }
    }),
  }));
  return response.json();
}

export async function generateWineNotes(wineName: string): Promise<WineData> {
  const params = new URLSearchParams({ action: "notes", wineName });
  const response = await fetchWithRetry(() => fetch(`/api/gemini?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  }));
  return response.json();
}

export async function getWinePairingForDish(dishName: string, excludedWineries: string[] = []): Promise<WinePairing> {
  const response = await fetchWithRetry(() => fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "pairing",
      payload: { dishName, excludedWineries }
    }),
  }));
  return response.json();
}