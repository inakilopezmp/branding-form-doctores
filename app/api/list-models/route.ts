import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * GET /api/list-models
 * Lista los modelos disponibles con tu GEMINI_API_KEY.
 * Útil para ver qué modelo de imagen usar (busca "imagen" o "generateImages").
 */
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no definida" },
        { status: 500 }
      );
    }
    const ai = new GoogleGenAI({ apiKey });
    const pager = await ai.models.list();
    const models: { name: string; displayName?: string; supportedActions?: string[] }[] = [];
    for await (const model of pager) {
      models.push({
        name: model.name ?? "",
        displayName: model.displayName,
        supportedActions: model.supportedActions
      });
    }
    const imageModels = models.filter(
      (m) =>
        m.supportedActions?.some((s) => s.toLowerCase().includes("image")) ||
        m.name?.toLowerCase().includes("imagen") ||
        m.name?.toLowerCase().includes("image")
    );
    return NextResponse.json({
      total: models.length,
      imageRelated: imageModels,
      allNames: models.map((m) => m.name).filter(Boolean)
    });
  } catch (err) {
    console.error("Error listando modelos:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
