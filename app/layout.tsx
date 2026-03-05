import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Formulario de Branding para Doctores",
  description:
    "Formulario para recolectar información de branding y materiales de consultorio para doctores."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body className="bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}

