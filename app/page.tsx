import Form from "../components/Form";
import FormHeader from "../components/FormHeader";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-8 md:p-10">
        <Suspense fallback={null}>
          <FormHeader />
        </Suspense>
        <Form />
      </div>
    </main>
  );
}

