import Form from "../components/Form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-8 md:p-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Formulario de Branding para Doctores
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Completa este formulario para que podamos diseñar tu identidad visual y
            materiales de consultorio.
          </p>
        </header>

        <Form />
      </div>
    </main>
  );
}

