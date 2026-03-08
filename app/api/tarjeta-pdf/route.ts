/**
 * Genera el PDF de la tarjeta personal desde HTML (mismo diseño que la vista).
 * POST body: { formData, isotipoDataUrl }
 * 2 páginas: anverso = logo centrado; reverso = texto + logo tenue + opcional QR.
 */

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

type TarjetaFormData = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  cedulaProfesional?: string;
  recetaEspecialidad?: string;
  recetaCedulaProfesional?: string;
  recetaCedulaEspecialidad?: string;
  telefono?: string;
  email?: string;
  direccionConsultorio?: string;
  whatsapp?: string;
};

function whatsappLink(numero?: string): string {
  if (!numero?.trim()) return "";
  const digits = numero.replace(/\D/g, "");
  const conCodigo = digits.length === 10 ? "52" + digits : digits;
  return "https://wa.me/" + conCodigo;
}

const iconPhone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const iconMail =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
const iconMap =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

function buildTarjetaHtml(
  form: TarjetaFormData,
  isotipoDataUrl: string,
  qrDataUrl: string | null
): string {
  const nombre = ((form.tituloAbreviado || "Dr.") + " " + (form.nombreCompleto || "")).trim();
  const especialidad = (form.recetaEspecialidad || form.especialidad || "").trim();
  const sub = (form.subespecialidad || "").trim();
  const subOk = sub && sub.toLowerCase() !== "no tengo";
  const cedula = form.recetaCedulaProfesional || form.cedulaProfesional || "";
  const tel = form.telefono || "—";
  const mail = form.email || "—";
  const dir = form.direccionConsultorio || "—";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Montserrat, system-ui, sans-serif; }
    .card-page { width: ${CARD_W_MM}mm; height: ${CARD_H_MM}mm; page-break-after: always; position: relative; overflow: hidden; background: #fff; }
    .card-page:last-child { page-break-after: auto; }
    .anverso { display: flex; align-items: center; justify-content: center; padding: 4mm; }
    .anverso img { max-height: 95%; max-width: 95%; width: auto; height: auto; object-fit: contain; }
    .reverso-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end; pointer-events: none; }
    .reverso-bg img { height: 160%; max-width: 90%; object-fit: contain; object-position: center; opacity: 0.12; margin-right: -20%; }
    .reverso-content { position: relative; z-index: 1; padding: 8px 12px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
    .reverso-inner { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
    .reverso-text { flex: 1; min-width: 0; }
    .reverso-text .nombre { font-weight: 700; font-size: 12px; color: #0f172a; margin: 0 0 2px; line-height: 1.2; }
    .reverso-text .especialidad { font-size: 10px; color: #475569; margin: 0; }
    .reverso-text .cedula { font-size: 10px; font-weight: 700; color: #1e293b; margin: 2px 0 0; }
    .reverso-text .line { height: 1px; background: #e2e8f0; margin: 6px 0; }
    .reverso-text .row { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #334155; margin-top: 2px; }
    .reverso-text .row svg { flex-shrink: 0; stroke: #64748b; }
    .reverso-qr { flex-shrink: 0; width: 56px; height: 56px; border: 1px solid #f1f5f9; background: #fff; overflow: hidden; }
    .reverso-qr img { width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  <div class="card-page anverso">
    <img src="${isotipoDataUrl.replace(/"/g, "&quot;")}" alt="" />
  </div>
  <div class="card-page">
    <div class="reverso-bg">
      <img src="${isotipoDataUrl.replace(/"/g, "&quot;")}" alt="" />
    </div>
    <div class="reverso-content">
      <div class="reverso-inner">
        <div class="reverso-text">
          <p class="nombre">${nombre || "Dr. [Nombre]"}</p>
          ${especialidad || subOk ? `<p class="especialidad">${especialidad}${especialidad && subOk ? " | " : ""}${subOk ? sub : ""}</p>` : ""}
          ${cedula ? `<p class="cedula">${cedula}</p>` : ""}
          <div class="line"></div>
          <div class="row">${iconPhone}<span>${tel}</span></div>
          <div class="row">${iconMail}<span>${mail}</span></div>
          <div class="row">${iconMap}<span>${dir}</span></div>
        </div>
        ${qrDataUrl ? `<div class="reverso-qr"><img src="${qrDataUrl.replace(/"/g, "&quot;")}" alt="QR" /></div>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, isotipoDataUrl }: { formData: TarjetaFormData; isotipoDataUrl: string } = body;

    if (!formData || !isotipoDataUrl) {
      return NextResponse.json(
        { error: "Faltan formData o isotipoDataUrl" },
        { status: 400 }
      );
    }

    let qrDataUrl: string | null = null;
    const waLink = whatsappLink(formData.whatsapp);
    if (waLink) {
      try {
        qrDataUrl = await QRCode.toDataURL(waLink, { width: 200, margin: 1 });
      } catch (_) {}
    }

    const html = buildTarjetaHtml(formData, isotipoDataUrl, qrDataUrl);

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
      width: `${CARD_W_MM}mm`,
      height: `${CARD_H_MM}mm`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Tarjeta.pdf"'
      }
    });
  } catch (err) {
    console.error("tarjeta-pdf:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar PDF" },
      { status: 500 }
    );
  }
}
