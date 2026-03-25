// 請將這段程式碼替換掉你 src/services/geminiService.ts 裡面的對應函式

export async function* getWinePairingForDish(dishName: string, excludedWineries: string[] = []) {
  // 1. 修正網址：精準對接後端定義的 /api/chat
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // 2. 修正 Payload：因為你的 chat.ts 接收 'prompt' 或 'messages'
    body: JSON.stringify({ 
      prompt: `請以專業虛擬侍酒師的身份，為這道菜推薦配餐酒：${dishName}。請避開以下酒莊：${excludedWineries.join(', ')}。` 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown Error" }));
    throw new Error(errorData.error || "Failed to get wine pairing");
  }

  // 3. 處理後端傳來的 SSE 串流 (解決原本 await response.json() 會報錯的問題)
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
        if (dataStr === "[DONE]") continue; // 處理串流結束標記
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            // 將解析出來的文字區塊 yield 出去給 UI 渲染打字機效果
            yield textPart; 
          }
        } catch (e) {
          console.warn("解析 SSE 事件失敗", e, dataStr);
        }
      }
    }
  }
}

// 同理，你的 chatStream 網址也要拿掉中間的 /gemini
export async function* chatStream(messages: any[], systemInstruction: string) {
  const response = await fetch("/api/chat", { // 修正為 /api/chat
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemInstruction }),
  });
  // ... 這裡保留你原本下方的 reader 解析邏輯 ...
}
