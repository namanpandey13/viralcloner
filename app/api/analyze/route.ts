import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing GEMINI_API_KEY' }, { status: 500 });
    }
    
    // Debug: Prove key is loaded
    console.log(`🔑 Key loaded: ${apiKey.substring(0, 4)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // UPDATED LIST: Based on your account's specific permissions
    const modelsToTry = [
      "gemini-2.0-flash",        // Your primary model
      "gemini-2.0-flash-001",    // Backup version
      "gemini-2.5-flash",        // Bleeding edge
      "gemini-pro-latest",       // Safe fallback
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`👉 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `
        You are an expert ghostwriter. Deconstruct this LinkedIn post:
        POST: "${text.substring(0, 2000)}" 
        
        Analyze these 4 components:
        1. THE HOOK: The pattern interrupt.
        2. THE STRUCTURE: The format.
        3. THE PSYCHOLOGY: The emotion targeted.
        4. THE TEMPLATE: A fill-in-the-blank template based on this post.
        
        Output format: Markdown. Keep it concise.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();
        
        console.log(`✅ SUCCESS with ${modelName}`);
        return NextResponse.json({ analysis });

      } catch (e: any) {
        console.error(`❌ Failed ${modelName}: ${e.message}`);
        lastError = e;
      }
    }

    throw lastError || new Error("All models failed");

  } catch (error: any) {
    console.error("🔥 CRASH:", error.message);
    return NextResponse.json({ error: `Analysis Failed: ${error.message}` }, { status: 500 });
  }
}