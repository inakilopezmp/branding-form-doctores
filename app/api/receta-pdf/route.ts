/**
 * Genera el PDF de la receta desde HTML con Puppeteer (mismo diseño que la vista).
 * POST body: { formData, options, isotipoDataUrl, imagotipoDataUrl }
 */

import { NextRequest, NextResponse } from "next/server";
import { parseAccentColor } from "../../../lib/colors";

type PdfFormData = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  recetaCedulaProfesional?: string;
  recetaCedulaEspecialidad?: string;
  cedulaProfesional?: string;
  cedulaEspecialidad?: string;
  recetaEspecialidad?: string;
  telefono?: string;
  email?: string;
  direccionConsultorio?: string;
  recetaTelefono?: string;
  recetaDireccion?: string;
  recetaCamposPersonalizados?: string;
  coloresPreferidos?: string;
};

type RecetaOptions = {
  variacion: 1 | 2;
  formato: "media_carta" | "carta" | "a5";
  orientacion: "horizontal" | "vertical";
  mostrarMarcaDeAgua: boolean;
};

function getLineales(form: PdfFormData): string[] {
  const raw = form.recetaCamposPersonalizados?.trim()
    ? form.recetaCamposPersonalizados.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean)
    : ["Paciente", "Edad", "Sexo", "Alergias", "Talla", "Peso", "IMC", "TA", "FC", "FR", "TEMP", "Diagnóstico", "Tratamiento"];
  return raw.filter((c) => !/^(tratamiento|diagnóstico|diagnostico)$/i.test(c));
}

function hasDiagnostico(form: PdfFormData): boolean {
  const raw = form.recetaCamposPersonalizados?.trim()
    ? form.recetaCamposPersonalizados.split(/[\n,]+/).map((c) => c.trim())
    : ["Diagnóstico"];
  return raw.some((c) => /^diagnóstico$/i.test(c) || /^diagnostico$/i.test(c));
}

function hasTratamiento(form: PdfFormData): boolean {
  const raw = form.recetaCamposPersonalizados?.trim()
    ? form.recetaCamposPersonalizados.split(/[\n,]+/).map((c) => c.trim())
    : ["Tratamiento"];
  return raw.some((c) => /^tratamiento$/i.test(c));
}

function buildRecetaHtml(
  form: PdfFormData,
  options: RecetaOptions,
  isotipoDataUrl: string,
  imagotipoDataUrl: string
): string {
  const accent = parseAccentColor(form.coloresPreferidos);
  const nombreReceta = ((form.tituloAbreviado || "Dr.") + " " + (form.nombreCompleto || "")).trim().toUpperCase();
  const especialidad = (form.recetaEspecialidad || form.especialidad || "").trim();
  const sub = (form.subespecialidad || "").trim();
  const subOk = sub && sub.toLowerCase() !== "no tengo";
  const lineales = getLineales(form);
  const tieneDiagnostico = hasDiagnostico(form);
  const tieneTratamiento = hasTratamiento(form);
  const tel = form.recetaTelefono || form.telefono || "—";
  const dir = form.recetaDireccion || form.direccionConsultorio || "—";
  const mail = form.email || "—";

  const linealesRow1 = lineales.slice(0, 4);
  const linealesRow2 = lineales.slice(4, 8);
  const linealesRow3 = lineales.slice(8);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Montserrat, system-ui, sans-serif; font-size: 12px; color: #334155; }
    .receta { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
    .header { flex-shrink: 0; padding: 16px 24px 12px; text-align: center; }
    .header .logo-wrap { margin-bottom: 8px; }
    .header img { height: 128px; width: auto; object-fit: contain; }
    .header .nombre { font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; font-size: 1.2rem; margin: 0 0 4px; }
    .header .especialidad { color: #475569; font-size: 0.8rem; margin: 0; }
    .header .cedula { color: #475569; font-size: 0.75rem; margin: 2px 0; }
    .header .header-line { height: 2px; width: 100%; margin-top: 12px; border: none; }
    .body { flex: 1; position: relative; padding: 16px 24px 24px; min-height: 0; display: flex; flex-direction: column; }
    .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; overflow: hidden; opacity: 0.07; }
    .watermark img { max-width: min(80%, 700px); max-height: 70%; object-fit: contain; }
    .content { position: relative; font-size: 12px; color: #334155; flex: 1; }
    .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 16px; margin-bottom: 12px; }
    .grid4 .label { color: #64748b; }
    .grid4 .dotted { border-bottom: 1px dotted #cbd5e1; min-width: 50px; display: inline-block; vertical-align: baseline; }
    .grid4 .dotted-fecha { min-width: 80px; flex: 1; }
    .grid4 .cell-fecha { display: flex; align-items: baseline; gap: 8px; flex-wrap: nowrap; }
    .grid4 .cell-fecha .dotted { flex: 1; min-width: 80px; }
    .grid7 { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px 8px; margin-bottom: 12px; }
    .grid7 .label { color: #64748b; }
    .grid7 .dotted { border-bottom: 1px dotted #cbd5e1; min-width: 28px; display: inline-block; vertical-align: baseline; }
    .diagnostico, .tratamiento { margin-top: 12px; }
    .diagnostico p, .tratamiento p { color: #64748b; margin: 0 0 4px; font-size: 0.85rem; }
    .diagnostico .dotted { border-bottom: 1px dotted #cbd5e1; min-height: 1.5em; width: 100%; display: block; }
    .tratamiento .box { border: 1px solid #e2e8f0; border-radius: 4px; min-height: 100px; padding: 8px; background: rgba(248,250,252,0.5); }
    .firma { margin-top: auto; flex-shrink: 0; align-self: flex-end; text-align: right; padding-bottom: 8px; }
    .firma .sig-line { border-bottom: 1px solid #94a3b8; min-width: 120px; display: inline-block; margin-bottom: 4px; }
    .firma .text { font-size: 10px; color: #64748b; margin: 0; }
    .footer { flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 24px; padding: 6px 24px; color: #fff; }
    .footer span { font-size: 10px; display: inline-flex; align-items: center; gap: 6px; }
    .footer svg { flex-shrink: 0; width: 14px; height: 14px; }
  </style>
</head>
<body>
  <div class="receta">
    <header class="header">
      <div class="logo-wrap"><img src="${isotipoDataUrl.replace(/"/g, "&quot;")}" alt="" /></div>
      <p class="nombre">${nombreReceta || "DR. [Nombre]"}</p>
      ${especialidad || subOk ? `<p class="especialidad">${especialidad}${especialidad && subOk ? " | " : ""}${subOk ? sub : ""}</p>` : ""}
      ${(form.recetaCedulaProfesional || form.cedulaProfesional) ? `<p class="cedula">CÉDULA PROFESIONAL: ${form.recetaCedulaProfesional || form.cedulaProfesional}</p>` : ""}
      ${(form.recetaCedulaEspecialidad || form.cedulaEspecialidad)?.trim() ? `<p class="cedula">CÉDULA ESPECIALIDAD: ${form.recetaCedulaEspecialidad || form.cedulaEspecialidad}</p>` : ""}
      <div class="header-line" style="background-color: ${accent}"></div>
    </header>
    <div class="body">
      ${options.mostrarMarcaDeAgua ? `<div class="watermark"><img src="${imagotipoDataUrl.replace(/"/g, "&quot;")}" alt="" /></div>` : ""}
      <div class="content">
        <div class="grid4">
          <div class="cell-fecha"><span class="label">Fecha:</span><span class="dotted dotted-fecha"></span></div>
        </div>
        ${linealesRow1.length ? `<div class="grid4">${linealesRow1.map((l) => `<div><span class="label">${l}:</span> <span class="dotted"></span></div>`).join("")}</div>` : ""}
        ${linealesRow2.length ? `<div class="grid4">${linealesRow2.map((l) => `<div><span class="label">${l}:</span> <span class="dotted"></span></div>`).join("")}</div>` : ""}
        ${linealesRow3.length ? `<div class="grid7">${linealesRow3.map((l) => `<div><span class="label">${l}</span> <span class="dotted"></span></div>`).join("")}</div>` : ""}
        ${tieneDiagnostico ? `<div class="diagnostico"><p>Diagnóstico:</p><span class="dotted"></span></div>` : ""}
        ${tieneTratamiento ? `<div class="tratamiento"><p>Tratamiento:</p><div class="box"></div></div>` : ""}
      </div>
      <div class="firma">
        <span class="sig-line"></span>
        <p class="text">Firma</p>
      </div>
    </div>
    <footer class="footer" style="background-color: ${accent}">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${tel}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${dir}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${mail}</span>
    </footer>
  </div>
</body>
</html>`;
}

/** HTML para receta variación 2 (Minimalista): cabecera izquierda + fecha derecha, lista de campos, firma centrada, pie en caja derecha. */
function buildRecetaHtmlMinimalista(
  form: PdfFormData,
  options: RecetaOptions,
  isotipoDataUrl: string,
  imagotipoDataUrl: string
): string {
  const accent = parseAccentColor(form.coloresPreferidos);
  const accentTenue = accent.length === 7 ? accent + "18" : accent + "18"; // alpha para fondo suave
  const nombreReceta = ((form.tituloAbreviado || "Dr.") + " " + (form.nombreCompleto || "")).trim();
  const especialidad = (form.recetaEspecialidad || form.especialidad || "").trim();
  const sub = (form.subespecialidad || "").trim();
  const subOk = sub && sub.toLowerCase() !== "no tengo";
  const lineales = getLineales(form);
  const tel = form.recetaTelefono || form.telefono || "—";
  const mail = form.email || "—";
  const dir = form.recetaDireccion || form.direccionConsultorio || "—";

  const iconPhone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const iconMail = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Montserrat, system-ui, sans-serif; font-size: 12px; color: #334155; }
    .receta-min { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
    .min-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 24px 16px; }
    .min-header-left img { width: 120px; height: 120px; object-fit: contain; object-position: left; margin-bottom: 8px; }
    .min-header-left .nombre { font-weight: 600; font-size: 14px; color: #1e293b; margin: 0 0 4px; }
    .min-header-left .meta { font-size: 12px; color: #475569; margin: 2px 0; }
    .min-header-left .meta-small { font-size: 10px; color: #475569; margin: 2px 0; }
    .min-header-right { font-size: 10px; color: #475569; text-align: right; }
    .min-header-right .fecha-line { border-bottom: 1px dotted #94a3b8; display: inline-block; vertical-align: baseline; margin: 0 2px; }
    .min-header-right .fecha-w1 { width: 32px; }
    .min-header-right .fecha-w2 { width: 40px; }
    .min-body { padding: 8px 24px 16px; }
    .min-body .campo { font-size: 10px; color: #334155; margin-bottom: 8px; }
    .min-body .campo .line { border-bottom: 1px solid rgba(100,116,139,0.5); min-width: 80px; display: inline-block; vertical-align: baseline; margin-left: 4px; }
    .min-presc { flex: 1; position: relative; min-height: 200px; padding: 16px 24px; }
    .min-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; overflow: hidden; opacity: 0.07; }
    .min-watermark img { max-width: min(80%, 400px); max-height: 70%; object-fit: contain; }
    .min-firma { display: flex; flex-direction: column; align-items: center; padding: 16px 24px 8px; }
    .min-firma .sig-line { border-bottom: 1px solid #94a3b8; min-width: 140px; margin-bottom: 4px; }
    .min-firma .text { font-size: 10px; color: #475569; opacity: 0.9; margin: 0; }
    .min-footer { margin-top: auto; display: flex; flex-direction: column; align-items: flex-end; padding: 0 24px 24px; }
    .min-footer-box { border-radius: 12px 0 0 0; padding: 12px 20px; font-size: 10px; display: flex; flex-direction: column; gap: 8px; }
    .min-footer-box .row { display: flex; align-items: center; gap: 8px; color: #334155; }
    .min-footer-box svg { flex-shrink: 0; width: 14px; height: 14px; stroke: #475569; }
  </style>
</head>
<body>
  <div class="receta-min">
    <div class="min-header">
      <div class="min-header-left">
        <img src="${isotipoDataUrl.replace(/"/g, "&quot;")}" alt="" />
        <p class="nombre">${nombreReceta || "Dr. [Nombre]"}</p>
        ${especialidad || subOk ? `<p class="meta">${especialidad}${especialidad && subOk ? " | " : ""}${subOk ? sub : ""}</p>` : ""}
        ${(form.recetaCedulaProfesional || form.cedulaProfesional) ? `<p class="meta-small">Cédula profesional: ${form.recetaCedulaProfesional || form.cedulaProfesional}</p>` : ""}
        ${(form.recetaCedulaEspecialidad || form.cedulaEspecialidad)?.trim() ? `<p class="meta-small">Cédula especialidad: ${form.recetaCedulaEspecialidad || form.cedulaEspecialidad}</p>` : ""}
        ${dir ? `<p class="meta-small">${dir}</p>` : ""}
      </div>
      <div class="min-header-right">
        <p>FECHA <span class="fecha-line fecha-w1"></span> / <span class="fecha-line fecha-w1"></span> / <span class="fecha-line fecha-w2"></span></p>
      </div>
    </div>
    <div class="min-body">
      ${lineales.map((l) => `<p class="campo">${l.toUpperCase()} <span class="line"></span></p>`).join("")}
    </div>
    <div class="min-presc">
      ${options.mostrarMarcaDeAgua ? `<div class="min-watermark"><img src="${imagotipoDataUrl.replace(/"/g, "&quot;")}" alt="" /></div>` : ""}
    </div>
    <div class="min-firma">
      <span class="sig-line"></span>
      <span class="text">FIRMA</span>
    </div>
    <div class="min-footer">
      <div class="min-footer-box" style="background-color: ${accentTenue}">
        <div class="row">${iconPhone} <span>${tel}</span></div>
        <div class="row">${iconMail} <span>${mail}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const PAPER_MM: Record<string, { w: number; h: number }> = {
  media_carta: { w: 297, h: 210 },
  carta: { w: 279, h: 216 },
  a5: { w: 210, h: 148 }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formData,
      options,
      isotipoDataUrl,
      imagotipoDataUrl
    }: {
      formData: PdfFormData;
      options: RecetaOptions;
      isotipoDataUrl: string;
      imagotipoDataUrl: string;
    } = body;

    if (!formData || !isotipoDataUrl) {
      return NextResponse.json(
        { error: "Faltan formData o isotipoDataUrl" },
        { status: 400 }
      );
    }

    const opts = options || {
      variacion: 1 as const,
      formato: "a5" as const,
      orientacion: "horizontal" as const,
      mostrarMarcaDeAgua: false
    };

    const html =
      opts.variacion === 2
        ? buildRecetaHtmlMinimalista(formData, opts, isotipoDataUrl, imagotipoDataUrl || isotipoDataUrl)
        : buildRecetaHtml(formData, opts, isotipoDataUrl, imagotipoDataUrl || isotipoDataUrl);

    const sizes = PAPER_MM[opts.formato] ?? PAPER_MM.a5;
    const isVertical = opts.orientacion === "vertical";
    const widthMm = isVertical ? sizes.h : sizes.w;
    const heightMm = isVertical ? sizes.w : sizes.h;

    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 15000
    });
    await page.emulateMediaType("print");

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: `${widthMm}mm`,
      height: `${heightMm}mm`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Receta.pdf"'
      }
    });
  } catch (err) {
    console.error("receta-pdf:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar PDF" },
      { status: 500 }
    );
  }
}
