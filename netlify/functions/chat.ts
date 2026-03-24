import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { messages, systemInstruction } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey as string });

    const model = "gemini-3-flash-preview";
    
    // We use streamGenerateContent for streaming
    const result = await ai.models.generateContentStream({
      model,
      contents: messages,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
      body: stream,
    };
  } catch (error: any) {
    console.error("Chat Stream Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
