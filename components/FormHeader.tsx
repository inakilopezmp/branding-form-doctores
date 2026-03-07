"use client";

type FormHeaderProps = {
  showTitle?: boolean;
};

export default function FormHeader({ showTitle = true }: FormHeaderProps) {
  return (
    <header className="mb-8 text-center space-y-4">
      <div className="flex items-center justify-center">
        <img
          src="/logo-maspacientes.svg"
          alt="+Pacientes"
          className="h-10 w-auto"
        />
      </div>
      {showTitle && (
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Formulario de Branding para Doctores
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Con esta información podremos diseñar tu logo médico, tarjeta profesional
            y recetas médicas listas para imprimir.
          </p>
        </div>
      )}
    </header>
  );
}
