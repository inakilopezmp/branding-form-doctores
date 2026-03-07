import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_BASE = "https://yohtffzgmwtuxvnqwgyu.supabase.co";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Falta formId" },
        { status: 400 }
      );
    }

    const supabaseKey = process.env.SUPABASE_API_KEY;
    if (!supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuración incompleta" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_BASE;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let data: { logo_urls: string[] | null } | null = null;
    const byId = await supabase
      .from("branding_forms")
      .select("logo_urls")
      .eq("id", formId)
      .maybeSingle();
    if (byId.error) {
      const byID = await supabase
        .from("branding_forms")
        .select("logo_urls")
        .eq("ID", formId)
        .maybeSingle();
      if (byID.error) {
        console.error("Error leyendo logo_urls:", byId.error);
        return NextResponse.json(
          { success: false, error: byID.error.message },
          { status: 500 }
        );
      }
      data = byID.data;
    } else {
      data = byId.data;
    }

    return NextResponse.json({
      success: true,
      logo_urls: data?.logo_urls ?? null
    });
  } catch (err) {
    console.error("Error en GET /api/logos:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener logos" },
      { status: 500 }
    );
  }
}
