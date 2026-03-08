"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useEffect, useState, useRef, Suspense } from "react";
import { STRIPE_URL } from "../../lib/constants";
import { parseAccentColor } from "../../lib/colors";
import StyledQR from "../../components/StyledQR";

type FormData = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  cedulaProfesional?: string;
  tarjetaTituloProfesional?: string;
  tarjetaInfoExtra?: string;
  tarjetaTel?: boolean;
  tarjetaWhatsapp?: boolean;
  tarjetaEmail?: boolean;
  tarjetaDireccion?: boolean;
  tarjetaRedes?: boolean;
  tarjetaQR?: boolean;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccionConsultorio?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  recetaNombre?: string;
  recetaEspecialidad?: string;
  recetaCedulaProfesional?: string;
  recetaCedulaEspecialidad?: string;
  recetaTelefono?: string;
  recetaDireccion?: string;
  tamanoReceta?: "media_carta" | "carta" | "a5";
  recetaMarcaDeAgua?: boolean;
  recetaCamposPersonalizados?: string;
  estiloLogo?: string;
  logoTipo?: string;
  coloresPreferidos?: string;
};

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

const RECETA_SIZES_LANDSCAPE: Record<string, { w: string; h: string }> = {
  media_carta: { w: "297mm", h: "210mm" },
  carta: { w: "279mm", h: "216mm" },
  a5: { w: "210mm", h: "148mm" }
};

function buildContactLines(form: FormData): string[] {
  const lines: string[] = [];
  if (form.tarjetaTel && form.telefono) lines.push(form.telefono);
  if (form.tarjetaWhatsapp && form.whatsapp) lines.push("WhatsApp: " + form.whatsapp);
  if (form.tarjetaEmail && form.email) lines.push(form.email);
  if (form.tarjetaDireccion && form.direccionConsultorio) lines.push(form.direccionConsultorio);
  if (form.tarjetaRedes) {
    const redes: string[] = [];
    if (form.instagram) redes.push("IG: " + form.instagram);
    if (form.facebook) redes.push(form.facebook);
    if (form.linkedin) redes.push("LinkedIn: " + form.linkedin);
    if (redes.length) lines.push(redes.join(" · "));
  }
  return lines;
}

function whatsappLink(numero?: string): string {
  if (!numero?.trim()) return "";
  const digits = numero.replace(/\D/g, "");
  const conCodigo = digits.length === 10 ? "52" + digits : digits;
  return "https://wa.me/" + conCodigo;
}

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const nombre = useMemo(
    () => decodeURIComponent(searchParams.get("nombre") || "").trim() || "Doctor",
    [searchParams]
  );
  const formId = searchParams.get("formId");
  const [logoUrls, setLogoUrls] = useState<string[] | null>(null);
  const [logosLoading, setLogosLoading] = useState(!!formId);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null);
  const [previewsReady, setPreviewsReady] = useState(false);
  const [selectLogoSaving, setSelectLogoSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [recetaMostrarMarcaDeAgua, setRecetaMostrarMarcaDeAgua] = useState(true);
  const [recetaFormato] = useState<"media_carta" | "carta" | "a5">("a5");
  const [recetaOrientacion, setRecetaOrientacion] = useState<"horizontal" | "vertical">("vertical");
  const [recetaVariacion, setRecetaVariacion] = useState<1 | 2>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const LOADING_MESSAGES = [
    "Recopilando tus respuestas",
    "Revisando referencias y competencia",
    "Definiendo paleta y estilo",
    "Esbozando conceptos de marca",
    "Diseñando el isotipo",
    "Completando el isotipo",
    "Generando primera variante de imagotipo",
    "Generando segunda variante",
    "Generando tercera variante",
    "Generando cuarta variante",
    "Revisando coherencia visual",
    "Ajustando detalles finales",
    "Preparando tus logos",
    "Casi listo…"
  ];

  useEffect(() => {
    if (!logosLoading) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) =>
        i >= LOADING_MESSAGES.length - 1 ? i : i + 1
      );
    }, 2200);
    return () => clearInterval(id);
  }, [logosLoading]);

  useEffect(() => {
    if (!formId) return;
    const check = async () => {
      try {
        const res = await fetch("/api/logos?formId=" + encodeURIComponent(formId));
        const data = await res.json().catch(() => null);
        if (data?.success && Array.isArray(data.logo_urls) && data.logo_urls.length > 0) {
          setLogoUrls(data.logo_urls);
          setLogosLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };
    check();
    intervalRef.current = setInterval(check, 3000);
    const t = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLogosLoading(false);
    }, 120000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(t);
    };
  }, [formId]);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className={`w-full bg-white shadow-lg rounded-2xl p-8 md:p-10 text-center space-y-6 ${previewsReady ? "max-w-4xl" : "max-w-lg"}`}>
        <div className="flex justify-center">
          <img
            src="/logo-maspacientes.svg"
            alt="+Pacientes"
            className="h-10 w-auto"
          />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Perfecto Dr. {nombre}.
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            Ya tenemos la información para diseñar su identidad médica.
          </p>
        </div>
        {formId && (
          <div className="border-t border-slate-200 pt-6 space-y-3">
            {logosLoading && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="logo-loading-animation" aria-hidden>
                  <svg viewBox="0 0 120 120" className="w-24 h-24 text-[#6556F2]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle className="logo-loading-circle-1" cx="60" cy="40" r="12" />
                    <circle className="logo-loading-circle-2" cx="40" cy="75" r="10" />
                    <circle className="logo-loading-circle-3" cx="85" cy="75" r="8" />
                    <path className="logo-loading-path" d="M35 50 Q60 30 85 50" />
                    <path className="logo-loading-path logo-loading-path-delay" d="M45 70 Q60 55 75 70" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600 min-h-[1.5rem] transition-opacity duration-500" key={loadingMessageIndex}>
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </p>
              </div>
            )}
            {logoUrls && logoUrls.length > 0 && (() => {
              const hasIsotipo = logoUrls.length > 4;
              const imagotipos = hasIsotipo ? logoUrls.slice(1) : logoUrls;
              if (imagotipos.length === 0) return null;
              return (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Selecciona el logo que te guste
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {imagotipos.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedLogoIndex(i)}
                      className={`block rounded-xl border-2 overflow-hidden bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6556F2] ${
                        selectedLogoIndex === i
                          ? "border-[#6556F2] ring-2 ring-[#6556F2] ring-offset-2"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Logo ${i + 1}`}
                        className="h-48 w-auto object-contain pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
                {selectedLogoIndex !== null && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={selectLogoSaving}
                      onClick={async () => {
                        if (formId == null || logoUrls == null) return;
                        setSelectLogoSaving(true);
                        try {
                          const res = await fetch("/api/select-logo", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              formId,
                              selectedLogoUrl: hasIsotipo ? logoUrls[selectedLogoIndex + 1] : logoUrls[selectedLogoIndex]
                            })
                          });
                          if (!res.ok) return;
                          const dataRes = await fetch("/api/form-data?formId=" + encodeURIComponent(formId));
                          const data = await dataRes.json().catch(() => null);
                          if (data?.success && data?.form) {
                            const f = data.form as FormData;
                            setFormData(f);
                            setRecetaMostrarMarcaDeAgua(f.recetaMarcaDeAgua !== false);
                            setPreviewsReady(true);
                          }
                        } finally {
                          setSelectLogoSaving(false);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-60"
                    >
                      {selectLogoSaving ? "Guardando…" : "Generar tarjeta y receta con este logo"}
                    </button>
                  </div>
                )}
              </div>
              );
            })()}
          </div>
        )}
        {previewsReady && formData && logoUrls && selectedLogoIndex !== null && (() => {
          const isotipoUrl = logoUrls[0];
          const imagotipoUrl = logoUrls.length > 4 ? logoUrls[selectedLogoIndex + 1] : logoUrls[selectedLogoIndex];
          return (
          <div className="border-t border-slate-200 pt-8 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Tarjeta personal</h2>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-500">Anverso</p>
                  <div
                    className="bg-white shadow-lg rounded-sm overflow-hidden border border-slate-200 flex items-center justify-center"
                    style={{ width: "85.6mm", minHeight: "53.98mm", maxWidth: "100%" }}
                  >
                    <img src={isotipoUrl} alt="" className="h-48 w-auto max-w-[95%] object-contain" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-500">Reverso</p>
                  <div
                    className="bg-white shadow-lg rounded-sm overflow-visible border border-slate-200 relative"
                    style={{ width: "85.6mm", minHeight: "53.98mm", maxWidth: "100%" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-visible">
                      <img src={isotipoUrl} alt="" className="h-[160%] w-auto max-w-[90%] object-contain object-center opacity-[0.12] -mr-[20%]" />
                    </div>
                    <div className="relative z-10 py-3 px-4 flex flex-col justify-end h-full w-full text-left" style={{ minHeight: "53.98mm" }}>
                      <div className="flex items-end justify-between gap-3">
                        <div className="space-y-0.5 text-left min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs leading-tight">
                            {(formData.tituloAbreviado || "Dr.") + " " + (formData.nombreCompleto || "")}
                          </p>
                          <p className="text-slate-600 text-[10px] font-normal mt-0.5">
                            {(formData.recetaEspecialidad || formData.especialidad || "").trim()}
                            {((formData.recetaEspecialidad || formData.especialidad)?.trim() && formData.subespecialidad?.trim()) ? " | " : ""}
                            {(formData.subespecialidad || "").trim()}
                          </p>
                          <p className="text-slate-800 text-[10px] font-bold mt-0.5">
                            {formData.recetaCedulaProfesional || formData.cedulaProfesional || ""}
                          </p>
                          <div className="h-px bg-slate-200 my-1.5 w-full" />
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                            <IconPhone className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                            <span>{formData.telefono || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 mt-0.5">
                            <IconMail className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                            <span className="truncate">{formData.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 mt-0.5">
                            <IconMapPin className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                            <span className="truncate">{formData.direccionConsultorio || "—"}</span>
                          </div>
                        </div>
                        {whatsappLink(formData.whatsapp) && (
                          <StyledQR
                            data={whatsappLink(formData.whatsapp)}
                            href={whatsappLink(formData.whatsapp)}
                            size={56}
                            className="shrink-0 inline-flex items-center justify-center w-14 h-14 overflow-hidden bg-white border border-slate-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Receta médica</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-w-3xl">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Marca de agua</p>
                  <select
                    value={recetaMostrarMarcaDeAgua ? "si" : "no"}
                    onChange={(e) => setRecetaMostrarMarcaDeAgua(e.target.value === "si")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-[#6556F2] focus:ring-1 focus:ring-[#6556F2] focus:outline-none"
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Orientación</p>
                  <select
                    value={recetaOrientacion}
                    onChange={(e) => setRecetaOrientacion(e.target.value as "horizontal" | "vertical")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-[#6556F2] focus:ring-1 focus:ring-[#6556F2] focus:outline-none"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Diseño</p>
                  <select
                    value={recetaVariacion}
                    onChange={(e) => setRecetaVariacion(Number(e.target.value) as 1 | 2)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-[#6556F2] focus:ring-1 focus:ring-[#6556F2] focus:outline-none"
                  >
                    <option value={1}>Clásico</option>
                    <option value={2}>Minimalista</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-center overflow-x-auto">
                <div
                  className="bg-white shadow-xl overflow-hidden border border-slate-200 flex flex-col"
                  style={{
                    width: (recetaOrientacion === "vertical" ? RECETA_SIZES_LANDSCAPE[recetaFormato]?.h : RECETA_SIZES_LANDSCAPE[recetaFormato]?.w) ?? (recetaOrientacion === "vertical" ? RECETA_SIZES_LANDSCAPE.carta.h : RECETA_SIZES_LANDSCAPE.carta.w),
                    minHeight: (recetaOrientacion === "vertical" ? RECETA_SIZES_LANDSCAPE[recetaFormato]?.w : RECETA_SIZES_LANDSCAPE[recetaFormato]?.h) ?? (recetaOrientacion === "vertical" ? RECETA_SIZES_LANDSCAPE.carta.w : RECETA_SIZES_LANDSCAPE.carta.h),
                    maxWidth: "100%",
                    fontFamily: recetaVariacion === 2 ? "Montserrat, Poppins, 'Open Sans', sans-serif" : "system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                  }}
                >
                  {recetaVariacion === 1 && (() => {
                    const accent = parseAccentColor(formData.coloresPreferidos);
                    const titulo = (formData.tituloAbreviado || "Dr.").toUpperCase();
                    const nombreReceta = titulo + " " + (formData.nombreCompleto || "").toUpperCase();
                    const hasCedulaEsp = !!(formData.recetaCedulaEspecialidad?.trim());
                    return (
                      <>
                        <header className="flex-shrink-0 px-6 pt-4 pb-3 text-center w-full" style={{ minHeight: "20%" }}>
                          <div className="flex justify-center mb-2">
                            <img src={imagotipoUrl} alt="" className="h-16 w-auto object-contain" />
                          </div>
                          <p className="font-bold text-slate-900 uppercase tracking-wide" style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}>
                            {nombreReceta || "DR. [Nombre]"}
                          </p>
                          {formData.recetaEspecialidad && (
                            <p className="text-slate-600 mt-0.5" style={{ fontSize: "0.8rem" }}>{formData.recetaEspecialidad}</p>
                          )}
                          {formData.recetaCedulaProfesional && (
                            <p className="text-slate-600 text-xs mt-0.5">CÉDULA PROFESIONAL: {formData.recetaCedulaProfesional}</p>
                          )}
                          {hasCedulaEsp && (
                            <p className="text-slate-600 text-xs">CÉDULA ESPECIALIDAD: {formData.recetaCedulaEspecialidad}</p>
                          )}
                          <div className="mt-3 h-0.5 w-full" style={{ backgroundColor: accent }} />
                        </header>

                        <div className="flex-1 relative px-6 py-4 w-full" style={{ minHeight: "60%" }}>
                          {recetaMostrarMarcaDeAgua && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ opacity: 0.07 }}>
                              <img src={imagotipoUrl} alt="" className="w-[min(80%,700px)] h-auto max-h-[70%] object-contain" />
                            </div>
                          )}
                          <div className="relative space-y-3 text-xs text-slate-700">
                            {(() => {
                              const campos = formData.recetaCamposPersonalizados?.trim()
                                ? formData.recetaCamposPersonalizados.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean)
                                : ["Paciente", "Edad", "Sexo", "Alergias", "Talla", "Peso", "IMC", "TA", "FC", "FR", "TEMP", "Diagnóstico", "Tratamiento"];
                              const lineales = campos.filter((c) => !/^(tratamiento|diagnóstico|diagnostico)$/i.test(c));
                              const tieneDiagnostico = campos.some((c) => /^diagnóstico$/i.test(c) || /^diagnostico$/i.test(c));
                              const tieneTratamiento = campos.some((c) => /^tratamiento$/i.test(c));
                              return (
                                <>
                                  <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                                    <div><span className="text-slate-500">Fecha:</span> <span className="border-b border-slate-300 border-dotted inline-block min-w-[80px] align-baseline" /></div>
                                  </div>
                                  {lineales.length > 0 && (
                                    <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                                      {lineales.slice(0, 4).map((l) => (
                                        <div key={l}><span className="text-slate-500">{l}:</span> <span className="border-b border-slate-300 border-dotted inline-block min-w-[50px] align-baseline" /></div>
                                      ))}
                                    </div>
                                  )}
                                  {lineales.length > 4 && (
                                    <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                                      {lineales.slice(4, 8).map((l) => (
                                        <div key={l}><span className="text-slate-500">{l}:</span> <span className="border-b border-slate-300 border-dotted inline-block min-w-[50px] align-baseline" /></div>
                                      ))}
                                    </div>
                                  )}
                                  {lineales.length > 8 && (
                                    <div className="grid grid-cols-7 gap-x-2 gap-y-1">
                                      {lineales.slice(8).map((l) => (
                                        <div key={l}><span className="text-slate-500">{l}</span> <span className="border-b border-slate-300 border-dotted inline-block min-w-[28px] align-baseline" /></div>
                                      ))}
                                    </div>
                                  )}
                                  {tieneDiagnostico && (
                                    <div>
                                      <p className="text-slate-500 mb-0.5">Diagnóstico:</p>
                                      <p className="border-b border-slate-300 border-dotted min-h-[1.5em] w-full" />
                                    </div>
                                  )}
                                  {tieneTratamiento && (
                                    <div>
                                      <p className="text-slate-500 mb-0.5">Tratamiento:</p>
                                      <div className="border border-slate-200 rounded min-h-[100px] p-2 bg-slate-50/50" />
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="absolute bottom-4 right-6 text-right">
                            <p className="border-b border-slate-400 inline-block min-w-[120px] mb-0.5" />
                            <p className="text-[10px] text-slate-500">Firma</p>
                          </div>
                        </div>

                        <footer className="flex-shrink-0 flex items-center justify-center gap-6 px-6 py-1.5 text-white w-full" style={{ backgroundColor: accent }}>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <IconPhone className="shrink-0 text-white" />
                            <span>{formData.recetaTelefono || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <IconMapPin className="shrink-0 text-white" />
                            <span>{formData.recetaDireccion || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <IconMail className="shrink-0 text-white" />
                            <span>{formData.email || "—"}</span>
                          </div>
                        </footer>
                      </>
                    );
                  })()}
                  {recetaVariacion === 2 && (() => {
                    const accent = parseAccentColor(formData.coloresPreferidos);
                    const nombreReceta = (formData.tituloAbreviado || "Dr.") + " " + (formData.nombreCompleto || "");
                    const accentTenue = accent + "18";
                    return (
                      <div className="flex flex-col h-full bg-white text-slate-700" style={{ fontFamily: "Montserrat, Poppins, 'Open Sans', sans-serif" }}>
                        {/* Encabezado superior izquierda + Fecha superior derecha */}
                        <div className="flex justify-between items-start px-6 pt-6 pb-4 w-full">
                          <div className="text-left">
                            <img src={imagotipoUrl} alt="" className="w-[7.5rem] h-[7.5rem] mb-2 object-contain object-left" />
                            <p className="font-semibold text-sm text-slate-800">{nombreReceta || "Dr. [Nombre]"}</p>
                            {formData.recetaEspecialidad && <p className="text-xs mt-0.5 text-slate-600">{formData.recetaEspecialidad}</p>}
                            {formData.recetaCedulaProfesional && <p className="text-[10px] mt-0.5 text-slate-600">Cédula profesional: {formData.recetaCedulaProfesional}</p>}
                            {formData.recetaCedulaEspecialidad?.trim() && <p className="text-[10px] text-slate-600">Cédula especialidad: {formData.recetaCedulaEspecialidad}</p>}
                          </div>
                          <div className="text-right text-xs text-slate-600">
                            <p>FECHA <span className="inline-block border-b border-slate-400 border-dotted w-8 align-baseline" /> / <span className="inline-block border-b border-slate-400 border-dotted w-8 align-baseline" /> / <span className="inline-block border-b border-slate-400 border-dotted w-10 align-baseline" /></p>
                          </div>
                        </div>
                        {/* Datos del paciente */}
                        <div className="px-6 py-2 space-y-2 text-left w-full text-slate-700">
                          <p className="text-xs">NOMBRE DEL PACIENTE <span className="inline-block border-b border-slate-400 min-w-[180px] align-baseline ml-1 opacity-70" /></p>
                          <p className="text-xs">EDAD <span className="inline-block border-b border-slate-400 min-w-[80px] align-baseline ml-1 opacity-70" /></p>
                        </div>
                        {/* Área prescripción */}
                        <div className="flex-1 relative flex px-6 py-4 min-h-[200px] w-full">
                          {recetaMostrarMarcaDeAgua && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ opacity: 0.07 }}>
                              <img src={imagotipoUrl} alt="" className="w-[min(80%,400px)] h-auto max-h-[70%] object-contain" />
                            </div>
                          )}
                          <div className="relative w-full flex-1 min-h-[180px]" />
                        </div>
                        {/* Firma centro */}
                        <div className="flex flex-col items-center px-6 pt-4 pb-2 w-full text-slate-600">
                          <span className="inline-block border-b border-slate-400 min-w-[140px] mb-1" />
                          <span className="text-[10px] opacity-80">FIRMA</span>
                        </div>
                        {/* Pie contacto esquina inferior derecha + dirección centrada abajo */}
                        <div className={`mt-auto flex flex-col items-end px-6 w-full ${!(formData.recetaDireccion || formData.direccionConsultorio) ? "pb-6" : ""}`}>
                          <div className="rounded-tl-xl rounded-tr-0 rounded-br-0 rounded-bl-0 px-4 py-3 text-xs space-y-2 shadow-sm text-slate-700" style={{ backgroundColor: accentTenue }}>
                            <div className="flex items-center gap-2 text-slate-700">
                              <IconPhone className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span>{formData.recetaTelefono || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <IconMail className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span>{formData.email || "—"}</span>
                            </div>
                          </div>
                          {(formData.recetaDireccion || formData.direccionConsultorio) && (
                            <div className="mt-4 mb-4 w-full flex justify-center items-center gap-1.5 text-[10px] text-slate-600">
                              <IconMapPin className="w-3 h-3 shrink-0 text-slate-500" />
                              <span>{formData.recetaDireccion || formData.direccionConsultorio}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          );
        })()}
        {previewsReady && formData && logoUrls && selectedLogoIndex !== null && (
          <div>
            <a
              href={STRIPE_URL}
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#6556F2" }}
            >
              Continuar al pago
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <p className="text-slate-600">Cargando…</p>
        </div>
      }
    >
      <ConfirmarContent />
    </Suspense>
  );
}
