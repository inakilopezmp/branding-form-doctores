"use client";

import { useState, Suspense } from "react";
import Form from "../components/Form";
import FormHeader from "../components/FormHeader";

export default function HomePage() {
  const [formStep, setFormStep] = useState(0);
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-8 md:p-10">
        <Suspense fallback={null}>
          <FormHeader showTitle={formStep !== 0} />
        </Suspense>
        <Suspense fallback={<div className="py-8 text-center text-slate-500">Cargando formulario…</div>}>
          <Form onStepChange={setFormStep} />
        </Suspense>
      </div>
    </main>
  );
}

