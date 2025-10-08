import { NextResponse } from "next/server";
import { deepseekChat } from "@/lib/ai/deepseek";

export async function POST(request: Request) {
  try {
    const { text, sourceLang, targetLang } = await request.json();
    if (!text || !sourceLang || !targetLang) return new NextResponse("Bad request", { status: 400 });
    const sys = "You are a professional translator for company profile content. Keep it concise and business-appropriate.";
    const prompt = `Translate the following from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}. Return only the translation.\n\n${text}`;
    const out = await deepseekChat(sys, prompt);
    return NextResponse.json({ translation: out?.trim() || "" });
  } catch {
    return new NextResponse("AI failed", { status: 500 });
  }
}


