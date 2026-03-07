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
 */

const SUPABASE_BASE = "https://yohtffzgmwtuxvnqwgyu.supabase.co";
const LOGOS_BUCKET = "logos";
const DEFAULT_IMAGEN_MODEL = "gemini-2.5-flash-image";

function isGeminiFlashImageModel(model: string): boolean {
  return model === "gemini-2.5-flash-image";
}

type LogoVariant = "isotipo" | "imagotipo";
/** Orden: [isotipo, imagotipo, imagotipo, imagotipo, imagotipo]. Tarjeta usa [0], receta usa el imagotipo elegido [1-4]. */
const LOGO_GENERATION_ORDER: LogoVariant[] = ["isotipo", "imagotipo", "imagotipo", "imagotipo", "imagotipo"];

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
    const { formId, form } = body as { formId: string; form: FormPayload };

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

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const logoUrls: string[] = [];

    const promptsSent: string[] = [];

    const model = process.env.IMAGEN_MODEL || DEFAULT_IMAGEN_MODEL;
    let rateLimitHit = false;
    const delayMs = 13000;

    for (let i = 0; i < LOGO_GENERATION_ORDER.length; i++) {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      const variant = LOGO_GENERATION_ORDER[i];
      const prompt = buildLogoPromptForVariant(form, variant);
      promptsSent.push(prompt);
      console.log("[generate-logos] Prompt enviado (variante " + variant + ", índice " + i + "):\n" + prompt + "\n---");

      let bytes: string | undefined;
      try {
        if (isGeminiFlashImageModel(model)) {
          const gcResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseModalities: ["IMAGE"]
            }
          });
          const part = gcResponse.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
          bytes = part?.inlineData?.data;
        } else {
          const response = await ai.models.generateImages({
            model,
            prompt,
            config: { numberOfImages: 1 }
          });
          const img = response.generatedImages?.[0];
          bytes = img?.image?.imageBytes;
        }
      } catch (imgErr: unknown) {
        const err = imgErr as { message?: string; status?: number; code?: number };
        const msg = String(err?.message ?? imgErr);

        if (msg.includes("paid plans") || msg.includes("upgrade your account") || msg.includes("INVALID_ARGUMENT")) {
          console.warn("[generate-logos] Imagen requiere plan de pago:", msg);
          return NextResponse.json(
            { success: false, reason: "paid_plan_required", error: "La generación de imágenes requiere un plan de pago en Google AI." },
            { status: 200 }
          );
        }

        const isRateLimit =
          err?.status === 429 ||
          err?.code === 429 ||
          /resource exhausted|quota|rate limit|rate_limit|RPM|RPD|429/i.test(msg);
        if (isRateLimit) {
          rateLimitHit = true;
          console.error("[generate-logos] Límite de tasa/cuota alcanzado (índice " + i + "):", msg);
          break;
        }

        console.error("[generate-logos] Error en variante " + variant + " (índice " + i + "):", imgErr);
        continue;
      }

      if (!bytes) {
        console.error("[generate-logos] No se obtuvo imagen para variante", variant);
        continue;
      }

      const buffer = Buffer.from(bytes, "base64");
      const path = `${formId}/${i}.png`;

      const { error: uploadError } = await supabase.storage
        .from(LOGOS_BUCKET)
        .upload(path, buffer, {
          contentType: "image/png",
          upsert: true
        });

      if (uploadError) {
        console.error("[generate-logos] Error subiendo imagen a Storage:", uploadError);
        continue;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
      logoUrls.push(publicUrl);
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
