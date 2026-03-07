"use client";

import { useState } from "react";
import Form from "../components/Form";
import FormHeader from "../components/FormHeader";
import { Suspense } from "react";

export default function HomePage() {
  const [formStep, setFormStep] = useState(0);
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-8 md:p-10">
        <Suspense fallback={null}>
          <FormHeader showTitle={formStep !== 0} />
        </Suspense>
        <Form onStepChange={setFormStep} />
      </div>
    </main>
  );
}

