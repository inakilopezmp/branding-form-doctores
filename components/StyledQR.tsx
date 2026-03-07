"use client";

import { useEffect, useRef } from "react";

type StyledQRProps = {
  /** URL to encode in the QR (e.g. WhatsApp wa.me link) */
  data: string;
  /** Size in pixels (width and height). Default 56. */
  size?: number;
  /** Optional className for the wrapper (e.g. for the link) */
  className?: string;
  /** href for the wrapping anchor (same as data typically) */
  href: string;
};

async function imageToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("No se pudo cargar el icono");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function StyledQR({ data, size = 56, className, href }: StyledQRProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const container = containerRef.current;

    const loadQR = async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      const iconUrl =
        typeof window !== "undefined"
          ? window.location.origin + "/Icons/WhatsApp.svg"
          : "/Icons/WhatsApp.svg";

      let imageSrc: string | undefined;
      try {
        imageSrc = await imageToDataUrl(iconUrl);
      } catch (e) {
        console.warn("[StyledQR] No se pudo cargar el icono, QR sin logo:", e);
      }

      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data,

        ...(imageSrc && { image: imageSrc }),

        dotsOptions: {
          color: "#000",
          type: "dots",
        },

        cornersDotOptions: {
          type: "dot",
        },

        ...(imageSrc && {
          imageOptions: {
            hideBackgroundDots: true,
            crossOrigin: "anonymous",
            margin: 10,
            imageSize: 0.35,
          },
        }),
      });

      container.innerHTML = "";
      qrCode.append(container);
    };

    loadQR();
  }, [data, size]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="WhatsApp"
    >
      <div
        ref={containerRef}
        className="[&_svg]:block [&_svg]:w-full [&_svg]:h-full"
        style={{ width: size, height: size }}
      />
    </a>
  );
}
