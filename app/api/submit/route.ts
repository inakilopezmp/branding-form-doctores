import { NextResponse } from "next/server";

const SUPABASE_URL =
  "https://yohtffzgmwtuxvnqwgyu.supabase.co/rest/v1/branding_forms";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiKey) {
      console.error("SUPABASE_API_KEY no está definido");
      return NextResponse.json(
        { success: false, error: "Configuración de Supabase incompleta" },
        { status: 500 }
      );
    }

    const payload = {
      fecha: new Date().toISOString(),
      json: body
    };

    const resp = await fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Error Supabase:", resp.status, text);
      return NextResponse.json(
        {
          success: false,
          error: "Error al guardar en Supabase",
          supabaseStatus: resp.status,
          supabaseBody: text
        },
        { status: 500 }
      );
    }

    const inserted = await resp.json().catch(() => null);
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    const id = row?.id ?? row?.ID ?? null;

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Error en /api/submit:", err);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

