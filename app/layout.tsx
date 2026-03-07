import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script";

export const metadata = {
  title: "Formulario de Branding para Doctores",
  description:
    "Formulario para recolectar información de branding y materiales de consultorio para doctores."
};

const clarityScript = `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "vs62xz6ed5");
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-100 text-slate-900">
        {children}
        <Script id="microsoft-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: clarityScript }} />
      </body>
    </html>
  );
}

