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

    const byId = await supabase
      .from("branding_forms")
      .select("json, logo_urls")
      .eq("id", formId)
      .maybeSingle();

    if (byId.error) {
      const byID = await supabase
        .from("branding_forms")
        .select("json, logo_urls")
        .eq("ID", formId)
        .maybeSingle();
      if (byID.error) {
        return NextResponse.json(
          { success: false, error: byID.error.message },
          { status: 500 }
        );
      }
      const row = byID.data;
      const form = row?.json ?? null;
      const formObj = form && typeof form === "object" ? form as Record<string, unknown> : {};
      return NextResponse.json({
        success: true,
        form,
        logo_urls: row?.logo_urls ?? null,
        selected_logo_url: (formObj.selected_logo_url as string) ?? null
      });
    }

    const row = byId.data;
    const form = row?.json ?? null;
    const formObj = form && typeof form === "object" ? form as Record<string, unknown> : {};
    return NextResponse.json({
      success: true,
      form,
      logo_urls: row?.logo_urls ?? null,
      selected_logo_url: (formObj.selected_logo_url as string) ?? null
    });
  } catch (err) {
    console.error("Error en GET /api/form-data:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
