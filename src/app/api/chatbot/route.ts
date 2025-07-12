import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `You are StackIt, a helpful assistant for a collaborative Q&A platform. Always be friendly and concise.`,
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  responseMimeType: "text/plain",
};

export async function POST(req: Request) {
  const data = await req.json();
  const { messages } = data;

  // Only include user messages in chat history for Gemini
  const chatHistory = messages
    .filter((msg: { role: "user" | "bot"; content: string }) => msg.role === "user")
    .map((msg: { role: "user" | "bot"; content: string }) => ({
      role: "user",
      parts: [{ text: msg.content }],
    }));

  try {
    // Start a chat session with the history
    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory,
    });

    // The latest user message is the last in the array
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    // Send the user's latest input to Gemini
    const result = await chatSession.sendMessage(lastUserMsg);

    // Extract AI response
    const aiResponse = result.response.text();

    return new Response(
      JSON.stringify({ reply: aiResponse }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing AI response:", error);
    return new Response(
      JSON.stringify({ reply: "Sorry, something went wrong." }),
      { status: 500 }
    );
  }
}
