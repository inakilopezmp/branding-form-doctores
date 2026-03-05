"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function FormHeader() {
  const searchParams = useSearchParams();
  const firstName = useMemo(
    () => searchParams.get("first_name")?.trim() || "",
    [searchParams]
  );

  return (
    <header className="mb-8 text-center space-y-4">
      <div className="flex items-center justify-center">
        <img
          src="/logo-maspacientes.svg"
          alt="+Pacientes"
          className="h-10 w-auto"
        />
      </div>
      <div>
        {firstName ? (
          <p className="text-lg md:text-xl text-slate-700 mb-1">
            Hola {firstName} 👋🏻, este es tu formulario de branding
          </p>
        ) : null}
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          Formulario de Branding para Doctores
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-600">
          Con esta información podremos diseñar tu identidad visual y materiales
          del consultorio
        </p>
      </div>
    </header>
  );
}
