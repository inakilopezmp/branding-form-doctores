"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StyledQR from "../../../../components/StyledQR";

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

type FormData = {
  nombreCompleto?: string;
  tituloAbreviado?: string;
  especialidad?: string;
  subespecialidad?: string;
  cedulaProfesional?: string;
  recetaCedulaProfesional?: string;
  recetaEspecialidad?: string;
  tarjetaNombre?: string;
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
};

export default function PreviewTarjetaPage() {
  const params = useParams();
  const formId = params?.formId as string | undefined;
  const [form, setForm] = useState<FormData | null>(null);
  const [isotipoUrl, setIsotipoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    fetch("/api/form-data?formId=" + encodeURIComponent(formId))
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.form) {
          setForm(data.form as FormData);
          const urls = Array.isArray(data.logo_urls) ? data.logo_urls : [];
          setIsotipoUrl(urls.length > 0 ? urls[0] : null);
        } else setError("No se encontraron datos");
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) return <div className="p-8 text-center text-slate-600">Cargando…</div>;
  if (error || !form) return <div className="p-8 text-center text-red-600">{error || "Sin datos"}</div>;

  const whatsappDigits = form.whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappDigits.length === 10
    ? "https://wa.me/52" + whatsappDigits
    : whatsappDigits.length > 0
      ? "https://wa.me/" + whatsappDigits
      : "";

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-wrap items-center justify-center gap-8">
      {/* Anverso: isotipo gigante como marca de agua a la derecha */}
      <div>
        <p className="text-xs text-slate-500 mb-1 text-center">Anverso</p>
        <div
          className="bg-white shadow-xl rounded-sm overflow-hidden border border-slate-300 flex items-center justify-center"
          style={{
            width: "85.6mm",
            minHeight: "53.98mm",
            maxWidth: "100%"
          }}
        >
          {isotipoUrl ? (
            <img src={isotipoUrl} alt="" className="h-48 w-auto max-w-[95%] object-contain" />
          ) : (
            <span className="text-slate-400 text-sm">Isotipo</span>
          )}
        </div>
      </div>
      {/* Reverso: izquierda nombre, especialidad|sub, cédula, línea, tel, email, dirección; derecha QR */}
      <div>
        <p className="text-xs text-slate-500 mb-1 text-center">Reverso</p>
        <div
          className="bg-white shadow-xl rounded-sm overflow-visible border border-slate-300 relative"
          style={{
            width: "85.6mm",
            minHeight: "53.98mm",
            maxWidth: "100%"
          }}
        >
          {isotipoUrl && (
            <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-visible">
              <img src={isotipoUrl} alt="" className="h-[160%] w-auto max-w-[90%] object-contain object-center opacity-[0.12] -mr-[20%]" />
            </div>
          )}
          <div className="relative z-10 py-3 px-4 flex flex-col justify-end h-full w-full text-left" style={{ minHeight: "53.98mm" }}>
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-0.5 text-left min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-xs leading-tight">
                  {(form.tituloAbreviado || "Dr.") + " " + (form.nombreCompleto || "")}
                </p>
                <p className="text-slate-600 text-[10px] font-normal mt-0.5">
                  {(form.recetaEspecialidad || form.especialidad || "").trim()}
                  {((form.recetaEspecialidad || form.especialidad)?.trim() && form.subespecialidad?.trim()) ? " | " : ""}
                  {(form.subespecialidad || "").trim()}
                </p>
                <p className="text-slate-800 text-[10px] font-bold mt-0.5">
                  {form.recetaCedulaProfesional || form.cedulaProfesional || ""}
                </p>
                <div className="h-px bg-slate-200 my-1.5 w-full" />
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                  <IconPhone className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                  <span>{form.telefono || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700 mt-0.5">
                  <IconMail className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                  <span className="truncate">{form.email || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700 mt-0.5">
                  <IconMapPin className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                  <span className="truncate">{form.direccionConsultorio || "—"}</span>
                </div>
              </div>
              {form.tarjetaQR && whatsappUrl ? (
                <StyledQR
                  data={whatsappUrl}
                  href={whatsappUrl}
                  size={56}
                  className="shrink-0 inline-flex items-center justify-center w-14 h-14 overflow-hidden bg-white border border-slate-100"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
