import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { parseAccentColor, hexToColorDescription } from "../../../lib/colors";

/**
 * Genera variantes de logo con Gemini y las guarda en Supabase Storage.
 * Soporta Imagen 4 (generateImages) y Gemini 2.5 Flash Image (generateContent).
 *
 * Setup en Supabase:
 * 1. Storage: crear bucket "logos" y marcarlo público (o usar políticas RLS).
 * 2. Tabla branding_forms: agregar columna logo_urls (tipo text[] o jsonb).
 * 3. .env: GEMINI_API_KEY (https://aistudio.google.com/apikey) y SUPABASE_API_KEY.
 * 4. Opcional: IMAGEN_MODEL. Por defecto gemini-2.5-flash-image. Alternativas: imagen-4.0-generate-001, imagen-4.0-ultra-generate-001.
 * 5. Optimización: LOGO_GEN_DELAY_MS (default 6000) = pausa en ms entre lotes; LOGO_GEN_CONCURRENCY (default 2) = cuántas imágenes se generan en paralelo por lote.
 */

const SUPABASE_BASE = "https://yohtffzgmwtuxvnqwgyu.supabase.co";
const LOGOS_BUCKET = "logos";
const DEFAULT_IMAGEN_MODEL = "gemini-2.5-flash-image";

function isGeminiFlashImageModel(model: string): boolean {
  return model === "gemini-2.5-flash-image";
}

type LogoVariant = "isotipo" | "imagotipo";
/** Orden final: [isotipo1, imagotipo1, isotipo2, imagotipo2, isotipo3, imagotipo3, isotipo4, imagotipo4]. Fase 1: 4 imagotipos en paralelo. Fase 2: 4 isotipos en paralelo, cada uno a partir de la imagen del imagotipo correspondiente. */
const NUM_IMAGOTIPOS = 4;
const ISOTIPO_FROM_IMAGE_PROMPT =
  "Crea una imagen donde solo se vea el isotipo (símbolo o icono) de este logo. Sin texto, sin letras, sin nombre. Solo el símbolo o icono, centrado en fondo blanco, manteniendo el mismo estilo y color. Una sola imagen, un único símbolo.";

type FormPayload = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  nombreClinica?: string;
  logoTipo?: string;
  estiloLogo?: string;
  coloresPreferidos?: string;
  coloresNoGustan?: string;
  simbolos?: string;
};

function buildLogoPromptForVariant(form: FormPayload, variant: LogoVariant): string {
  const nombreCompleto = form.nombreCompleto?.trim() || "Médico";
  const titulo = (form.tituloAbreviado?.trim() || "Dr.").trim();
  const nombreParaMarca = `${titulo} ${nombreCompleto}`.trim();
  const especialidad = form.especialidad?.trim() || "Medicina";
  const subespecialidad = form.subespecialidad?.trim() || "";
  const clinica = form.nombreClinica?.trim() || "";
  const formaLogo = form.logoTipo || "nombre_completo";
  const simbolosDeseados = form.simbolos?.trim() || "";
  const estilo = form.estiloLogo || "moderno";
  const coloresPreferidos = form.coloresPreferidos?.trim() || "azul, blanco";
  const coloresNoGustan = form.coloresNoGustan?.trim() || "";
  const colorHex = parseAccentColor(form.coloresPreferidos);
  const colorDesc = hexToColorDescription(colorHex);

  const formaTexto =
    formaLogo === "iniciales"
      ? "monograma con las iniciales del doctor"
      : formaLogo === "nombre_clinica" && clinica
        ? `nombre de la clínica: ${clinica}`
        : "nombre completo del doctor como elemento principal";

  const estiloTexto =
    estilo === "minimalista"
      ? "minimalista, líneas limpias, sin elementos superfluos"
      : estilo === "elegante"
        ? "elegante, serio, tipografía refinada"
        : estilo === "medico_clasico"
          ? "clásico médico, serio, confiable"
          : "moderno, limpio, profesional";

  const iconografia = simbolosDeseados
    ? `Usar prioritariamente este símbolo o tema: ${simbolosDeseados}.`
    : "Usar iconografía médica elegante y minimalista: estetoscopio, corazón con electrocardiograma, cruz médica, caduceo o bastón de Asclepio, ondas médicas. Un solo símbolo, simple.";

  const colorBlock = `Color principal del logo: exactamente ${colorHex} (código HEX). Tono: ${colorDesc}. Usar solo este color para ícono y texto; blanco y gris suave permitidos. Evitar completamente: ${coloresNoGustan || "ninguno"}.`;

  const reglas = `Reglas: logo simple, memorable, limpio, legible en tamaño pequeño. Sin exceso de detalles, sin sombras complejas, sin efectos 3D. Debe funcionar en fondo blanco. Tipografía sans-serif moderna (Montserrat, Poppins, Lato, Open Sans). El nombre del doctor debe ser el elemento principal; la especialidad como subtítulo. No incluir ninguna palabra genérica ni etiquetas en el diseño: solo el nombre real del doctor, su especialidad y el símbolo.`;

  const unaSolaImagen = "IMPORTANTE: La imagen debe contener UN ÚNICO logo nada más. No incluir varias versiones, ni múltiples logos, ni variantes en la misma imagen. Una sola composición de logo por imagen.";

  if (variant === "isotipo") {
    return `Logo médico profesional: solo el símbolo o icono, sin texto.

${unaSolaImagen}

INFORMACIÓN DEL DOCTOR (solo para contexto; no escribir texto en la imagen):
Nombre: ${nombreCompleto}. Especialidad: ${especialidad}.

PREFERENCIAS: Forma = símbolo únicamente. Estilo: ${estiloTexto}. ${iconografia}
COLOR: ${colorBlock}
${reglas}

Generar una sola imagen con únicamente un icono o símbolo médico, centrado en fondo blanco. Sin palabras, sin letras, sin nombre. Un único ícono en color ${colorHex}.`;
  }

  return `Logo médico profesional para uso en recetas, tarjetas, redes y papelería clínica.

${unaSolaImagen}

INFORMACIÓN DEL DOCTOR (estos textos deben aparecer en el logo):
- Nombre profesional para marca: ${nombreParaMarca}
- Especialidad: ${especialidad}
${subespecialidad ? `- Subespecialidad: ${subespecialidad}` : ""}
${clinica ? `- Clínica: ${clinica}` : ""}

ESTRUCTURA VISUAL (un solo logo):
A la izquierda: un símbolo o icono médico.
A la derecha (o debajo): el texto "${nombreParaMarca}" como elemento principal.
Debajo del nombre: "${especialidad}" como subtítulo más pequeño.

PREFERENCIAS: Forma = ${formaTexto}. Estilo visual: ${estiloTexto}. ${iconografia}

COLORES: ${colorBlock}

${reglas}

Generar una sola imagen con un único logo: símbolo + nombre "${nombreParaMarca}" + especialidad "${especialidad}". Fondo blanco o transparente. Centrado. Sin palabras genéricas ni etiquetas. Sin repetir el logo ni mostrar variantes.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, form, force } = body as { formId: string; form: FormPayload; force?: boolean };

    if (!formId || !form) {
      return NextResponse.json(
        { success: false, error: "Faltan formId o form" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseKey = process.env.SUPABASE_API_KEY;

    if (!geminiKey) {
      console.error("GEMINI_API_KEY no está definido");
      return NextResponse.json(
        { success: false, error: "Configuración de Gemini incompleta" },
        { status: 500 }
      );
    }
    if (!supabaseKey) {
      console.error("SUPABASE_API_KEY no está definido");
      return NextResponse.json(
        { success: false, error: "Configuración de Supabase incompleta" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_BASE;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Evitar generación duplicada: si ya hay un set completo de logos, no volver a generar (salvo force=true)
    if (!force) {
      const { data: existing } = await supabase
        .from("branding_forms")
        .select("logo_urls")
        .eq("id", formId)
        .maybeSingle();
      const existingByID = existing ?? (await supabase.from("branding_forms").select("logo_urls").eq("ID", formId).maybeSingle()).data;
    const existingUrls = (existingByID?.logo_urls ?? []) as string[];
    if (existingUrls.length >= NUM_IMAGOTIPOS * 2) {
      console.log("[generate-logos] formId " + formId + " ya tiene " + existingUrls.length + " logos; se omite generación duplicada.");
      return NextResponse.json({ success: true, count: existingUrls.length, urls: existingUrls });
    }
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const logoUrls: string[] = [];

    const promptsSent: string[] = [];

    const model = process.env.IMAGEN_MODEL || DEFAULT_IMAGEN_MODEL;
    const delayMs = Math.max(2000, Number(process.env.LOGO_GEN_DELAY_MS) || 6000);
    let rateLimitHit = false;

    const imagotipoPrompt = buildLogoPromptForVariant(form, "imagotipo");
    promptsSent.push(imagotipoPrompt);

    const generateImagotipo = async (variantIndex: number): Promise<{ url: string; bytes: string } | null> => {
      const path = `${formId}/${2 * variantIndex + 1}.png`;
      console.log("[generate-logos] Prompt imagotipo " + (variantIndex + 1) + " (1A-1D)...");
      let bytes: string | undefined;
      try {
        if (isGeminiFlashImageModel(model)) {
          const gcResponse = await ai.models.generateContent({
            model,
            contents: imagotipoPrompt,
            config: { responseModalities: ["IMAGE"] }
          });
          const part = gcResponse.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
          bytes = part?.inlineData?.data;
        } else {
          const response = await ai.models.generateImages({
            model,
            prompt: imagotipoPrompt,
            config: { numberOfImages: 1 }
          });
          bytes = response.generatedImages?.[0]?.image?.imageBytes;
        }
      } catch (imgErr: unknown) {
        const err = imgErr as { message?: string; status?: number; code?: number };
        const msg = String(err?.message ?? imgErr);
        if (msg.includes("paid plans") || msg.includes("upgrade your account") || msg.includes("INVALID_ARGUMENT")) throw { paidPlan: true };
        if (err?.status === 429 || err?.code === 429 || /resource exhausted|quota|rate limit|rate_limit|RPM|RPD|429/i.test(msg)) {
          console.error("[generate-logos] Límite de tasa (imagotipo " + (variantIndex + 1) + "):", msg);
          throw { rateLimit: true };
        }
        console.error("[generate-logos] Error imagotipo " + (variantIndex + 1) + ":", imgErr);
        return null;
      }
      if (!bytes) return null;
      const { error: uploadError } = await supabase.storage.from(LOGOS_BUCKET).upload(path, Buffer.from(bytes, "base64"), { contentType: "image/png", upsert: true });
      if (uploadError) {
        console.error("[generate-logos] Error subiendo imagotipo:", uploadError);
        return null;
      }
      return { url: supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path).data.publicUrl, bytes };
    };

    const generateIsotipoFromImage = async (imageBase64: string, variantIndex: number): Promise<string | null> => {
      const path = `${formId}/${2 * variantIndex}.png`;
      console.log("[generate-logos] Isotipo desde imagotipo " + (variantIndex + 1) + " (2A-2D)...");
      try {
        const gcResponse = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ inlineData: { mimeType: "image/png", data: imageBase64 } }, { text: ISOTIPO_FROM_IMAGE_PROMPT }] }],
          config: { responseModalities: ["IMAGE"] }
        });
        const part = gcResponse.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const bytes = part?.inlineData?.data;
        if (!bytes) return null;
        const { error: uploadError } = await supabase.storage.from(LOGOS_BUCKET).upload(path, Buffer.from(bytes, "base64"), { contentType: "image/png", upsert: true });
        if (uploadError) return null;
        return supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path).data.publicUrl;
      } catch (err) {
        console.error("[generate-logos] Error isotipo desde imagen " + (variantIndex + 1) + ":", err);
        return null;
      }
    };

    let phase1Results: ({ url: string; bytes: string } | null)[] = [];
    try {
      phase1Results = await Promise.all([0, 1, 2, 3].map((i) => generateImagotipo(i)));
    } catch (e) {
      if (e && typeof e === "object" && "paidPlan" in e) {
        return NextResponse.json(
          { success: false, reason: "paid_plan_required", error: "La generación de imágenes requiere un plan de pago en Google AI." },
          { status: 200 }
        );
      }
      if (e && typeof e === "object" && "rateLimit" in e) {
        rateLimitHit = true;
      }
    }

    await new Promise((r) => setTimeout(r, delayMs));

    let phase2Results: (string | null)[] = [];
    if (!rateLimitHit && isGeminiFlashImageModel(model)) {
      promptsSent.push(ISOTIPO_FROM_IMAGE_PROMPT);
      phase2Results = await Promise.all(
        phase1Results.map((r, i) => (r?.bytes ? generateIsotipoFromImage(r.bytes, i) : Promise.resolve(null)))
      );
    }

    for (let i = 0; i < NUM_IMAGOTIPOS; i++) {
      const imUrl = phase1Results[i]?.url ?? null;
      const isoUrl = phase2Results[i] ?? imUrl;
      if (imUrl) {
        logoUrls.push(isoUrl ?? imUrl);
        logoUrls.push(imUrl);
      }
    }

    if (rateLimitHit && logoUrls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          reason: "rate_limit",
          error: "Se alcanzó el límite de uso de la API de imágenes (RPM o RPD). Prueba mañana o usa IMAGEN_MODEL=imagen-4.0-generate-001 en .env para más cuota diaria."
        },
        { status: 200 }
      );
    }

    if (logoUrls.length > 0) {
      let updateError = (
        await supabase
          .from("branding_forms")
          .update({ logo_urls: logoUrls })
          .eq("id", formId)
      ).error;
      if (updateError) {
        updateError = (
          await supabase
            .from("branding_forms")
            .update({ logo_urls: logoUrls })
            .eq("ID", formId)
        ).error;
      }
      if (updateError) {
        console.error("Error actualizando logo_urls en branding_forms:", updateError);
      }
    }

    const res: { success: true; count: number; urls: string[]; debug_prompts?: string[] } = {
      success: true,
      count: logoUrls.length,
      urls: logoUrls
    };
    if (process.env.NODE_ENV === "development" && promptsSent.length > 0) {
      res.debug_prompts = promptsSent;
    }
    return NextResponse.json(res);
  } catch (err) {
    console.error("Error en /api/generate-logos:", err);
    return NextResponse.json(
      { success: false, error: "Error al generar logos" },
      { status: 500 }
    );
  }
}
