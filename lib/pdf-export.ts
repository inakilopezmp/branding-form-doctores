/**
 * Genera PDFs con texto editable (no imágenes de la página).
 * Tarjeta: anverso = logo (imagen), reverso = texto + logo (imagen).
 * Receta: cabecera con logo y texto, cuerpo con etiquetas y líneas, pie con contacto.
 */

import { parseAccentColor } from "./colors";

export type PdfFormData = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  cedulaProfesional?: string;
  cedulaEspecialidad?: string;
  telefono?: string;
  email?: string;
  direccionConsultorio?: string;
  recetaCedulaProfesional?: string;
  recetaCedulaEspecialidad?: string;
  recetaTelefono?: string;
  recetaDireccion?: string;
  recetaCamposPersonalizados?: string;
  coloresPreferidos?: string;
};

const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

const RECETA_SIZES_MM: Record<string, { w: number; h: number }> = {
  media_carta: { w: 297, h: 210 },
  carta: { w: 279, h: 216 },
  a5: { w: 210, h: 148 }
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

/** Convierte URL de imagen a base64 data URL (para addImage en jsPDF). */
export async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Genera PDF de tarjeta personal (2 páginas): anverso = logo; reverso = texto editable + logo tenue. */
export async function buildTarjetaPdf(
  form: PdfFormData,
  isotipoDataUrl: string
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: [CARD_W_MM, CARD_H_MM] });

  // Página 1: anverso — solo logo centrado
  doc.addImage(isotipoDataUrl, "PNG", 5, 5, CARD_W_MM - 10, CARD_H_MM - 10, undefined, "FAST");

  // Página 2: reverso — texto editable
  doc.addPage([CARD_W_MM, CARD_H_MM]);
  const margin = 4;
  let y = 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${form.tituloAbreviado || "Dr."} ${form.nombreCompleto || ""}`.trim(), margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const esp = (form.especialidad || "").trim();
  const sub = (form.subespecialidad || "").trim();
  const subOk = sub && sub.toLowerCase() !== "no tengo";
  if (esp || subOk) {
    doc.text(esp + (esp && subOk ? " | " : "") + (subOk ? sub : ""), margin, y);
    y += 4;
  }
  const cedula = form.cedulaProfesional || "";
  if (cedula) {
    doc.setFont("helvetica", "bold");
    doc.text(cedula, margin, y);
    doc.setFont("helvetica", "normal");
    y += 4;
  }
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, CARD_W_MM - margin, y);
  y += 5;
  doc.setFontSize(7);
  if (form.telefono) doc.text(String(form.telefono), margin, y), (y += 4);
  if (form.email) doc.text(String(form.email), margin, y), (y += 4);
  if (form.direccionConsultorio) doc.text(String(form.direccionConsultorio), margin, y);

  return doc.output("blob");
}

type RecetaOptions = {
  variacion: 1 | 2;
  formato: "media_carta" | "carta" | "a5";
  orientacion: "horizontal" | "vertical";
  mostrarMarcaDeAgua: boolean;
};

/** Campos lineales por defecto (sin Diagnóstico/Tratamiento para la lista de líneas). */
function getCamposLineales(form: PdfFormData): string[] {
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

/** Genera PDF de receta con texto editable. */
export async function buildRecetaPdf(
  form: PdfFormData,
  options: RecetaOptions,
  isotipoDataUrl: string,
  imagotipoDataUrl: string
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const sizes = RECETA_SIZES_MM[options.formato] ?? RECETA_SIZES_MM.a5;
  const isVertical = options.orientacion === "vertical";
  const w = isVertical ? sizes.h : sizes.w;
  const h = isVertical ? sizes.w : sizes.h;
  const doc = new jsPDF({ unit: "mm", format: [w, h] });
  const accent = parseAccentColor(form.coloresPreferidos);
  const [r, g, b] = hexToRgb(accent);
  const margin = 10;
  let y = margin;

  // Logo en cabecera
  doc.addImage(isotipoDataUrl, "PNG", margin, y, 25, 25, undefined, "FAST");
  y += 28;

  const nombreReceta = `${form.tituloAbreviado || "Dr."} ${form.nombreCompleto || ""}`.trim();
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(nombreReceta.toUpperCase(), margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const esp = (form.especialidad || "").trim();
  const sub = (form.subespecialidad || "").trim();
  const subOk = sub && sub.toLowerCase() !== "no tengo";
  if (esp || subOk) {
    doc.text(esp + (esp && subOk ? " | " : "") + (subOk ? sub : ""), margin, y);
    y += 5;
  }
  if (form.recetaCedulaProfesional || form.cedulaProfesional) {
    doc.text("CÉDULA PROFESIONAL: " + (form.recetaCedulaProfesional || form.cedulaProfesional), margin, y);
    y += 5;
  }
  if (form.recetaCedulaEspecialidad?.trim() || form.cedulaEspecialidad?.trim()) {
    doc.text("CÉDULA ESPECIALIDAD: " + (form.recetaCedulaEspecialidad || form.cedulaEspecialidad), margin, y);
    y += 5;
  }
  y += 3;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, w - margin, y);
  y += 8;

  const lineales = getCamposLineales(form);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Fecha: _________________________", margin, y);
  y += 6;
  doc.setTextColor(0, 0, 0);
  const colWidth = (w - 2 * margin - 15) / 4;
  for (let i = 0; i < Math.min(lineales.length, 8); i += 4) {
    const row = lineales.slice(i, i + 4);
    for (let j = 0; j < row.length; j++) {
      doc.text(row[j] + ": ________", margin + j * (colWidth + 2), y);
    }
    y += 5;
  }
  if (lineales.length > 8) {
    for (let i = 8; i < lineales.length; i++) {
      doc.text(lineales[i] + ": ________", margin, y);
      y += 5;
    }
  }
  y += 3;
  if (hasDiagnostico(form)) {
    doc.setTextColor(100, 100, 100);
    doc.text("Diagnóstico:", margin, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, w - margin, y);
    y += 8;
  }
  if (hasTratamiento(form)) {
    doc.setTextColor(100, 100, 100);
    doc.text("Tratamiento:", margin, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, y, w - 2 * margin, 35);
    y += 40;
  }
  y += 5;
  doc.setFontSize(7);
  doc.text("Firma: _________________________", w - margin - 50, y);

  // Pie con contacto
  doc.setFillColor(r, g, b);
  doc.rect(0, h - 12, w, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  const tel = form.recetaTelefono || form.telefono || "";
  const dir = form.recetaDireccion || form.direccionConsultorio || "";
  const mail = form.email || "";
  const pie = [tel, dir, mail].filter(Boolean).join("  ·  ");
  doc.text(pie, margin, h - 5);

  return doc.output("blob");
}
