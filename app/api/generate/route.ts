import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "No prompt" }, { status: 400 });
    }

    // FIXED - OLD MODEL DELETED BY GOOGLE
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      `Generate a high quality fashion CGI image description for: ${prompt}. Studio lighting, centered, 4k, streetwear aesthetic`
    );
    
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ 
      image: text,
      output: text,
      prompt: prompt,
      success: true 
    });

  } catch (error: any) {
    console.error("GENERATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Generate failed", details: String(error) },
      { status: 500 }
    );
  }
}
