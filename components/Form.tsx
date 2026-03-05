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
  estiloLogo: "minimalista" | "moderno" | "elegante" | "medico_clasico" | "";
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

const BRAND = "#6556F2";

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
  estiloLogo: "",
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
  const [redirecting, setRedirecting] = useState(false);
  const [step, setStep] = useState(1);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const TOTAL_STEPS = 7;
  const isLastStep = step === TOTAL_STEPS;

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
    setInvalidFields((prev) => prev.filter((f) => f !== name));
  };

  type StepValidation = { message: string | null; fields: string[] };

  const validateStep = (s: number): StepValidation => {
    if (s === 1) {
      const fields: string[] = [];
      if (!form.nombreCompleto.trim()) fields.push("nombreCompleto");
      if (!form.especialidad.trim()) fields.push("especialidad");
      if (!form.subespecialidad.trim()) fields.push("subespecialidad");
      if (fields.length)
        return {
          message: "Por favor completa los campos obligatorios marcados.",
          fields
        };
      return { message: null, fields: [] };
    }
    if (s === 2) {
      const fields: string[] = [];
      if (!form.telefono.trim()) fields.push("telefono");
      if (!form.whatsapp.trim()) fields.push("whatsapp");
      if (!form.direccionConsultorio.trim()) fields.push("direccionConsultorio");
      if (fields.length)
        return {
          message: "Por favor completa los campos obligatorios marcados.",
          fields
        };
      return { message: null, fields: [] };
    }
    if (s === 5) {
      const fields: string[] = [];
      if (!form.recetaNombre.trim()) fields.push("recetaNombre");
      if (!form.recetaTelefono.trim()) fields.push("recetaTelefono");
      if (!form.recetaDireccion.trim()) fields.push("recetaDireccion");
      if (!form.tamanoReceta) fields.push("tamanoReceta");
      if (fields.length)
        return {
          message: "Por favor completa los campos obligatorios marcados.",
          fields
        };
      return { message: null, fields: [] };
    }
    if (s === 6) {
      const fields: string[] = [];
      if (!form.tarjetaNombre.trim()) fields.push("tarjetaNombre");
      if (!form.tarjetaTituloProfesional.trim()) fields.push("tarjetaTituloProfesional");
      if (!form.orientacionTarjeta) fields.push("orientacionTarjeta");
      if (fields.length)
        return {
          message: "Por favor completa los campos obligatorios marcados.",
          fields
        };
      return { message: null, fields: [] };
    }
    return { message: null, fields: [] };
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
    setRedirecting(false);

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
      setLoading(false);
      setRedirecting(true);
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
      if (!redirecting) {
        setLoading(false);
      }
    }
  };

  const sectionClass =
    "border border-slate-200 rounded-xl p-4 md:p-5 bg-slate-50/60 space-y-4";

  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6556F2] focus:border-[#6556F2] bg-white";
  const textareaClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6556F2] focus:border-[#6556F2] bg-white min-h-[80px] resize-y";

  const handleNext = () => {
    const { message, fields } = validateStep(step);
    if (message) {
      setErrorMsg(message);
      setInvalidFields(fields);
      return;
    }
    setErrorMsg(null);
    setInvalidFields([]);
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setInvalidFields([]);
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const inputClassWithInvalid = (name: string) => {
    const base =
      "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6556F2] focus:border-[#6556F2] bg-white";
    const border = invalidFields.includes(name)
      ? "border-red-500"
      : "border-slate-200";
    return `${base} ${border}`;
  };
  const textareaClassWithInvalid = (name: string) => {
    const base =
      "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6556F2] focus:border-[#6556F2] bg-white min-h-[80px] resize-y";
    const border = invalidFields.includes(name)
      ? "border-red-500"
      : "border-slate-200";
    return `${base} ${border}`;
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Paso {step} de {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, backgroundColor: BRAND }}
          />
        </div>
      </div>

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

      {step === 1 && (
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
              className={inputClassWithInvalid("nombreCompleto")}
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
              className={inputClassWithInvalid("especialidad")}
              value={form.especialidad}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="subespecialidad">
              Subespecialidad *
            </label>
            <input
              id="subespecialidad"
              name="subespecialidad"
              className={inputClassWithInvalid("subespecialidad")}
              value={form.subespecialidad}
              onChange={handleChange}
              placeholder='Ej: No tengo'
              required
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
      )}

      {step === 2 && (
      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 2 — Información de contacto
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="telefono">
              Teléfono (el que verán los pacientes) *
            </label>
            <input
              id="telefono"
              name="telefono"
              className={inputClassWithInvalid("telefono")}
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="whatsapp">
              WhatsApp *
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              className={inputClassWithInvalid("whatsapp")}
              value={form.whatsapp}
              onChange={handleChange}
              required
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
              Dirección del consultorio *
            </label>
            <input
              id="direccionConsultorio"
              name="direccionConsultorio"
              className={inputClassWithInvalid("direccionConsultorio")}
              value={form.direccionConsultorio}
              onChange={handleChange}
              required
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
      )}

      {step === 3 && (
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
                className="border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
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
                className="border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
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
                className="border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
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
          <p className="text-sm font-medium text-slate-700 mb-3">
            Estilo del logo (selecciona uno)
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                value: "minimalista",
                label: "Minimalista",
                src: "/tarjeta-minimalista.jpg",
              },
              {
                value: "moderno",
                label: "Moderno",
                src: "/tarjeta-moderno.jpg",
              },
              {
                value: "elegante",
                label: "Elegante",
                src: "/tarjeta-elegante.jpg",
              },
              {
                value: "medico_clasico",
                label: "Médico clásico",
                src: "/tarjeta-medico-clasico.jpg",
              },
            ].map(({ value, label, src }) => (
              <label
                key={value}
                className={`relative flex flex-col rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
                  form.estiloLogo === value
                    ? "border-[#6556F2] ring-2 ring-[#6556F2]/30"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="estiloLogo"
                  value={value}
                  checked={form.estiloLogo === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="min-h-[140px] bg-slate-100 flex items-center justify-center p-2">
                  <img
                    src={src}
                    alt={label}
                    className="w-full h-full object-contain max-h-[200px]"
                  />
                </div>
                <span className="py-2 text-center text-sm font-medium text-slate-700 bg-white border-t border-slate-100">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>
      )}

      {step === 4 && (
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
      )}

      {step === 5 && (
      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 5 — Información para recetas médicas
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="recetaNombre">
              Nombre que debe aparecer *
            </label>
            <input
              id="recetaNombre"
              name="recetaNombre"
              className={inputClassWithInvalid("recetaNombre")}
              value={form.recetaNombre}
              onChange={handleChange}
              required
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
              Teléfono *
            </label>
            <input
              id="recetaTelefono"
              name="recetaTelefono"
              className={inputClassWithInvalid("recetaTelefono")}
              value={form.recetaTelefono}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="recetaDireccion">
              Dirección *
            </label>
            <input
              id="recetaDireccion"
              name="recetaDireccion"
              className={inputClassWithInvalid("recetaDireccion")}
              value={form.recetaDireccion}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tamanoReceta">
              Tamaño de receta *
            </label>
            <select
              id="tamanoReceta"
              name="tamanoReceta"
              className={inputClassWithInvalid("tamanoReceta")}
              value={form.tamanoReceta}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="media_carta">Media carta</option>
              <option value="carta">Carta</option>
              <option value="a5">A5</option>
            </select>
          </div>
        </div>
      </section>
      )}

      {step === 6 && (
      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 6 — Tarjeta personal
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="tarjetaNombre">
              Nombre que debe aparecer *
            </label>
            <input
              id="tarjetaNombre"
              name="tarjetaNombre"
              className={inputClassWithInvalid("tarjetaNombre")}
              value={form.tarjetaNombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tarjetaTituloProfesional">
              Título profesional *
            </label>
            <input
              id="tarjetaTituloProfesional"
              name="tarjetaTituloProfesional"
              className={inputClassWithInvalid("tarjetaTituloProfesional")}
              value={form.tarjetaTituloProfesional}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="orientacionTarjeta">
              Orientación de la tarjeta *
            </label>
            <select
              id="orientacionTarjeta"
              name="orientacionTarjeta"
              className={inputClassWithInvalid("orientacionTarjeta")}
              value={form.orientacionTarjeta}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
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
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>Teléfono</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaWhatsapp"
                checked={form.tarjetaWhatsapp}
                onChange={handleChange}
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>WhatsApp</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaEmail"
                checked={form.tarjetaEmail}
                onChange={handleChange}
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>Email</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaDireccion"
                checked={form.tarjetaDireccion}
                onChange={handleChange}
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>Dirección</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaRedes"
                checked={form.tarjetaRedes}
                onChange={handleChange}
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>Redes sociales</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="tarjetaQR"
                checked={form.tarjetaQR}
                onChange={handleChange}
                className="rounded border-slate-300 text-[#6556F2] focus:ring-[#6556F2]"
              />
              <span>QR</span>
            </label>
          </div>
        </div>
      </section>
      )}

      {step === 7 && (
      <section className={sectionClass}>
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Sección 7 — Detalles de diseño
        </h2>
        <div>
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
      )}

      <div className="pt-2 flex flex-col items-stretch md:items-center gap-3 md:flex-row md:justify-between">
        {isLastStep && (
          <p className="text-xs text-slate-500 max-w-md">
            Al enviar este formulario tus respuestas se guardarán de forma segura
            y serás redirigido al pago en Stripe para completar tu solicitud.
          </p>
        )}
        <div className="flex w-full justify-end gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Atrás
            </button>
          )}
          {!isLastStep && (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm md:text-base font-semibold text-white shadow-md hover:opacity-90 transition-opacity w-full md:w-auto"
              style={{ backgroundColor: BRAND }}
            >
              Siguiente
            </button>
          )}
          {isLastStep && (
            <button
              type="submit"
              disabled={loading || redirecting}
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity w-full md:w-auto"
              style={{ backgroundColor: BRAND }}
            >
              {redirecting
                ? "Redireccionando"
                : loading
                ? "Enviando..."
                : "Completar y continuar al pago"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

