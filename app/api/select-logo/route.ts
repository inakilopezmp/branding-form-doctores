import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_BASE = "https://yohtffzgmwtuxvnqwgyu.supabase.co";

/**
 * POST body: { formId: string, selectedLogoUrl: string }
 * Guarda el logo elegido dentro del campo json (selected_logo_url) en branding_forms.
 * No requiere columnas nuevas.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { formId, selectedLogoUrl } = body;
    if (!formId || typeof selectedLogoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Faltan formId o selectedLogoUrl" },
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

    let row: { json: Record<string, unknown> | null } | null = null;
    const byId = await supabase.from("branding_forms").select("json").eq("id", formId).maybeSingle();
    if (byId.error) {
      const byID = await supabase.from("branding_forms").select("json").eq("ID", formId).maybeSingle();
      if (byID.error) {
        console.error("Error leyendo formulario:", byID.error);
        return NextResponse.json({ success: false, error: byID.error.message }, { status: 500 });
      }
      row = byID.data;
    } else row = byId.data;

    const currentJson = (row?.json && typeof row.json === "object" ? row.json : {}) as Record<string, unknown>;
    const updatedJson = { ...currentJson, selected_logo_url: selectedLogoUrl };

    let err = (
      await supabase.from("branding_forms").update({ json: updatedJson }).eq("id", formId)
    ).error;
    if (err) {
      err = (
        await supabase.from("branding_forms").update({ json: updatedJson }).eq("ID", formId)
      ).error;
    }
    if (err) {
      console.error("Error actualizando json:", err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error en POST /api/select-logo:", e);
    return NextResponse.json(
      { success: false, error: "Error al guardar selección" },
      { status: 500 }
    );
  }
}
