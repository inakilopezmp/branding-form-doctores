"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type FormData = {
  recetaNombre?: string;
  recetaEspecialidad?: string;
  recetaCedulaProfesional?: string;
  recetaCedulaEspecialidad?: string;
  recetaTelefono?: string;
  recetaDireccion?: string;
  tamanoReceta?: "media_carta" | "carta" | "a5";
};

const SIZES: Record<string, { w: string; h: string }> = {
  media_carta: { w: "216mm", h: "140mm" },
  carta: { w: "216mm", h: "279mm" },
  a5: { w: "148mm", h: "210mm" }
};

export default function PreviewRecetaPage() {
  const params = useParams();
  const formId = params?.formId as string | undefined;
  const [form, setForm] = useState<FormData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    fetch("/api/form-data?formId=" + encodeURIComponent(formId))
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.form) {
          setForm(data.form as FormData);
          setLogoUrl(data.selected_logo_url || (Array.isArray(data.logo_urls) && data.logo_urls[0]) || null);
        } else setError("No se encontraron datos");
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) return <div className="p-8 text-center text-slate-600">Cargando…</div>;
  if (error || !form) return <div className="p-8 text-center text-red-600">{error || "Sin datos"}</div>;

  const size = form.tamanoReceta && SIZES[form.tamanoReceta] ? SIZES[form.tamanoReceta] : SIZES.a5;

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex items-center justify-center">
      <div
        className="bg-white shadow-xl rounded-sm overflow-hidden"
        style={{
          width: size.w,
          minHeight: size.h,
          maxWidth: "100%"
        }}
      >
        <div className="p-6 flex flex-col h-full">
          <header className="border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              )}
              <div className="text-right text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{form.recetaNombre || ""}</p>
                {form.recetaEspecialidad && <p>{form.recetaEspecialidad}</p>}
                {form.recetaCedulaProfesional && (
                  <p className="text-xs">Céd. Prof. {form.recetaCedulaProfesional}</p>
                )}
                {form.recetaCedulaEspecialidad && (
                  <p className="text-xs">Céd. Esp. {form.recetaCedulaEspecialidad}</p>
                )}
                {form.recetaTelefono && <p className="text-xs">{form.recetaTelefono}</p>}
                {form.recetaDireccion && <p className="text-xs">{form.recetaDireccion}</p>}
              </div>
            </div>
          </header>
          <div className="flex-1 space-y-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Paciente:</p>
              <p className="border-b border-slate-300 border-dotted min-h-[1.5em]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fecha:</p>
              <p className="border-b border-slate-300 border-dotted min-h-[1.5em]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Prescripción:</p>
              <div className="border border-slate-200 rounded p-3 min-h-[120px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
