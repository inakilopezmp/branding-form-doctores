"use client";

import { FormEvent, useState } from "react";

const STRIPE_URL =
  "https://buy.stripe.com/8x27sD3Ti5jrfNigKv8ww0M";

type Orientation = "horizontal" | "vertical" | "";
type TamanoReceta = "media_carta" | "carta" | "a5" | "";

type FormState = {
  nombreCompleto: string;
  especialidad: string;
  subespecialidad: string;
  cedulaProfesional: string;
  cedulaEspecialidad: string;
  nombreClinica: string;
  telefono: string;
  whatsapp: string;
  email: string;
  sitioWeb: string;
  direccionConsultorio: string;
  ciudad: string;
  estadoProvincia: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  logoTipo: "nombre_completo" | "iniciales" | "nombre_clinica" | "";
  simbolos: string;
  coloresPreferidos: string;
  coloresNoGustan: string;
  estiloMinimalista: boolean;
  estiloModerno: boolean;
  estiloElegante: boolean;
  estiloMedicoClasico: boolean;
  linksReferencias: string;
  recetaNombre: string;
  recetaEspecialidad: string;
  recetaCedulaProfesional: string;
  recetaCedulaEspecialidad: string;
  recetaTelefono: string;
  recetaDireccion: string;
  recetaQRWhatsapp: boolean;
  recetaQRGoogleMaps: boolean;
  recetaQRAgenda: boolean;
  tarjetaNombre: string;
  tarjetaTituloProfesional: string;
  tarjetaInfoExtra: string;
  tarjetaTel: boolean;
  tarjetaWhatsapp: boolean;
  tarjetaEmail: boolean;
  tarjetaDireccion: boolean;
  tarjetaRedes: boolean;
  tarjetaQR: boolean;
  orientacionTarjeta: Orientation;
  tamanoReceta: TamanoReceta;
  comentariosAdicionales: string;
};

const initialState: FormState = {
  nombreCompleto: "",
  especialidad: "",
  subespecialidad: "",
  cedulaProfesional: "",
  cedulaEspecialidad: "",
  nombreClinica: "",
  telefono: "",
  whatsapp: "",
  email: "",
  sitioWeb: "",
  direccionConsultorio: "",
  ciudad: "",
  estadoProvincia: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  logoTipo: "nombre_completo",
  simbolos: "",
  coloresPreferidos: "",
  coloresNoGustan: "",
  estiloMinimalista: true,
  estiloModerno: false,
  estiloElegante: false,
  estiloMedicoClasico: false,
  linksReferencias: "",
  recetaNombre: "",
  recetaEspecialidad: "",
  recetaCedulaProfesional: "",
  recetaCedulaEspecialidad: "",
  recetaTelefono: "",
  recetaDireccion: "",
  recetaQRWhatsapp: false,
  recetaQRGoogleMaps: false,
  recetaQRAgenda: false,
  tarjetaNombre: "",
  tarjetaTituloProfesional: "",
  tarjetaInfoExtra: "",
  tarjetaTel: true,
  tarjetaWhatsapp: true,
  tarjetaEmail: true,
  tarjetaDireccion: false,
  tarjetaRedes: false,
  tarjetaQR: false,
  orientacionTarjeta: "",
  tamanoReceta: "",
  comentariosAdicionales: ""
};

export default function Form() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validate = () => {
    if (!form.nombreCompleto.trim())
      return "Por favor ingresa tu nombre completo.";
    if (!form.especialidad.trim())
      return "Por favor ingresa tu especialidad.";
    if (!form.telefono.trim()) return "Por favor ingresa un teléfono.";
    if (!form.email.trim()) return "Por favor ingresa un correo electrónico.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);
      setInfoMsg("Guardando tu información, por favor espera...");

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Error al enviar el formulario");
      }

      setInfoMsg("¡Gracias! Redirigiendo al pago de Stripe...");
      setTimeout(() => {
        window.location.href = STRIPE_URL;
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Ocurrió un error al enviar el formulario. Intenta de nuevo en unos momentos."
      );
      setInfoMsg(null);
    } finally {
      setLoading(false);
    }
  };

  const sectionClass =
    "border border-slate-200 rounded-xl p-4 md:p-5 bg-slate-50/60 space-y-4";

  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white";
  const textareaClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white min-h-[80px] resize-y";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(errorMsg || infoMsg) && (
        <div className="space-y-2 mb-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          {infoMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              {infoMsg}
            </div>
          )}
        </div>
      )}

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 1 — Información del doctor
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="nombreCompleto">
              Nombre completo *
            </label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              className={inputClass}
              value={form.nombreCompleto}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="especialidad">
              Especialidad *
            </label>
            <input
              id="especialidad"
              name="especialidad"
              className={inputClass}
              value={form.especialidad}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="subespecialidad">
              Subespecialidad
            </label>
            <input
              id="subespecialidad"
              name="subespecialidad"
              className={inputClass}
              value={form.subespecialidad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cedulaProfesional">
              Cédula profesional
            </label>
            <input
              id="cedulaProfesional"
              name="cedulaProfesional"
              className={inputClass}
              value={form.cedulaProfesional}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cedulaEspecialidad">
              Cédula de especialidad
            </label>
            <input
              id="cedulaEspecialidad"
              name="cedulaEspecialidad"
              className={inputClass}
              value={form.cedulaEspecialidad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nombreClinica">
              Nombre de la clínica o consultorio
            </label>
            <input
              id="nombreClinica"
              name="nombreClinica"
              className={inputClass}
              value={form.nombreClinica}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 2 — Información de contacto
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="telefono">
              Teléfono *
            </label>
            <input
              id="telefono"
              name="telefono"
              className={inputClass}
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="whatsapp">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              className={inputClass}
              value={form.whatsapp}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Correo electrónico *
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className={inputClass}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sitioWeb">
              Sitio web
            </label>
            <input
              id="sitioWeb"
              name="sitioWeb"
              className={inputClass}
              value={form.sitioWeb}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="direccionConsultorio">
              Dirección del consultorio
            </label>
            <input
              id="direccionConsultorio"
              name="direccionConsultorio"
              className={inputClass}
              value={form.direccionConsultorio}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ciudad">
              Ciudad
            </label>
            <input
              id="ciudad"
              name="ciudad"
              className={inputClass}
              value={form.ciudad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="estadoProvincia">
              Estado / provincia
            </label>
            <input
              id="estadoProvincia"
              name="estadoProvincia"
              className={inputClass}
              value={form.estadoProvincia}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="instagram">
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              className={inputClass}
              value={form.instagram}
              onChange={handleChange}
              placeholder="@usuario"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="facebook">
              Facebook
            </label>
            <input
              id="facebook"
              name="facebook"
              className={inputClass}
              value={form.facebook}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="linkedin">
              LinkedIn
            </label>
            <input
              id="linkedin"
              name="linkedin"
              className={inputClass}
              value={form.linkedin}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 3 — Preferencias del logo
        </h2>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            ¿Cómo quieres que aparezca el logo?
          </p>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="logoTipo"
                value="nombre_completo"
                checked={form.logoTipo === "nombre_completo"}
                onChange={handleChange}
                className="border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Nombre completo</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="logoTipo"
                value="iniciales"
                checked={form.logoTipo === "iniciales"}
                onChange={handleChange}
                className="border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Iniciales</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="logoTipo"
                value="nombre_clinica"
                checked={form.logoTipo === "nombre_clinica"}
                onChange={handleChange}
                className="border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Nombre de clínica</span>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="simbolos">
              Símbolos que te gustaría incluir
            </label>
            <textarea
              id="simbolos"
              name="simbolos"
              className={textareaClass}
              value={form.simbolos}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="coloresPreferidos">
                Colores preferidos
              </label>
              <textarea
                id="coloresPreferidos"
                name="coloresPreferidos"
                className={textareaClass}
                value={form.coloresPreferidos}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="coloresNoGustan">
                Colores que NO te gustan
              </label>
              <textarea
                id="coloresNoGustan"
                name="coloresNoGustan"
                className={textareaClass}
                value={form.coloresNoGustan}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Estilo del logo (puedes seleccionar varios)
          </p>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="estiloMinimalista"
                checked={form.estiloMinimalista}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Minimalista</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="estiloModerno"
                checked={form.estiloModerno}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Moderno</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="estiloElegante"
                checked={form.estiloElegante}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Elegante</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="estiloMedicoClasico"
                checked={form.estiloMedicoClasico}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Médico clásico</span>
            </label>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 4 — Referencias
        </h2>
        <label className={labelClass} htmlFor="linksReferencias">
          Links de logos o marcas que te gusten
        </label>
        <textarea
          id="linksReferencias"
          name="linksReferencias"
          className={textareaClass}
          value={form.linksReferencias}
          onChange={handleChange}
          placeholder="Pega aquí enlaces de Instagram, Pinterest, sitios web, etc."
        />
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 5 — Información para recetas médicas
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="recetaNombre">
              Nombre que debe aparecer
            </label>
            <input
              id="recetaNombre"
              name="recetaNombre"
              className={inputClass}
              value={form.recetaNombre}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaEspecialidad">
              Especialidad
            </label>
            <input
              id="recetaEspecialidad"
              name="recetaEspecialidad"
              className={inputClass}
              value={form.recetaEspecialidad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaCedulaProfesional">
              Cédula profesional
            </label>
            <input
              id="recetaCedulaProfesional"
              name="recetaCedulaProfesional"
              className={inputClass}
              value={form.recetaCedulaProfesional}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaCedulaEspecialidad">
              Cédula especialidad
            </label>
            <input
              id="recetaCedulaEspecialidad"
              name="recetaCedulaEspecialidad"
              className={inputClass}
              value={form.recetaCedulaEspecialidad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaTelefono">
              Teléfono
            </label>
            <input
              id="recetaTelefono"
              name="recetaTelefono"
              className={inputClass}
              value={form.recetaTelefono}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaDireccion">
              Dirección
            </label>
            <input
              id="recetaDireccion"
              name="recetaDireccion"
              className={inputClass}
              value={form.recetaDireccion}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            ¿Deseas incluir QR en la receta?
          </p>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="recetaQRWhatsapp"
                checked={form.recetaQRWhatsapp}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>WhatsApp</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="recetaQRGoogleMaps"
                checked={form.recetaQRGoogleMaps}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Google Maps</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="recetaQRAgenda"
                checked={form.recetaQRAgenda}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Agenda / citas</span>
            </label>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 6 — Tarjeta personal
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="tarjetaNombre">
              Nombre que debe aparecer
            </label>
            <input
              id="tarjetaNombre"
              name="tarjetaNombre"
              className={inputClass}
              value={form.tarjetaNombre}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tarjetaTituloProfesional">
              Título profesional
            </label>
            <input
              id="tarjetaTituloProfesional"
              name="tarjetaTituloProfesional"
              className={inputClass}
              value={form.tarjetaTituloProfesional}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="tarjetaInfoExtra">
            Información adicional a incluir
          </label>
          <textarea
            id="tarjetaInfoExtra"
            name="tarjetaInfoExtra"
            className={textareaClass}
            value={form.tarjetaInfoExtra}
            onChange={handleChange}
          />
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            ¿Qué información te gustaría que aparezca en la tarjeta?
          </p>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaTel"
                checked={form.tarjetaTel}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Teléfono</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaWhatsapp"
                checked={form.tarjetaWhatsapp}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>WhatsApp</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaEmail"
                checked={form.tarjetaEmail}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Email</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaDireccion"
                checked={form.tarjetaDireccion}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Dirección</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaRedes"
                checked={form.tarjetaRedes}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Redes sociales</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaQR"
                checked={form.tarjetaQR}
                onChange={handleChange}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>QR</span>
            </label>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 7 — Detalles de diseño
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="orientacionTarjeta">
              Orientación de la tarjeta
            </label>
            <select
              id="orientacionTarjeta"
              name="orientacionTarjeta"
              className={inputClass}
              value={form.orientacionTarjeta}
              onChange={handleChange}
            >
              <option value="">Selecciona una opción</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="tamanoReceta">
              Tamaño de receta
            </label>
            <select
              id="tamanoReceta"
              name="tamanoReceta"
              className={inputClass}
              value={form.tamanoReceta}
              onChange={handleChange}
            >
              <option value="">Selecciona una opción</option>
              <option value="media_carta">Media carta</option>
              <option value="carta">Carta</option>
              <option value="a5">A5</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="comentariosAdicionales">
            Comentarios adicionales
          </label>
          <textarea
            id="comentariosAdicionales"
            name="comentariosAdicionales"
            className={textareaClass}
            value={form.comentariosAdicionales}
            onChange={handleChange}
            placeholder="Cualquier detalle extra que debamos considerar."
          />
        </div>
      </section>

      <div className="pt-2 flex flex-col items-stretch md:items-end gap-3">
        <p className="text-xs text-slate-500 max-w-md">
          Al enviar este formulario tus respuestas se guardarán de forma segura
          y serás redirigido al pago en Stripe para completar tu solicitud.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-8 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
        >
          {loading ? "Enviando..." : "Enviar y continuar al pago"}
        </button>
      </div>
    </form>
  );
}

