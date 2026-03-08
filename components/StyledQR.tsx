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

export default function StyledQR({ data, size = 56, className, href }: StyledQRProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const container = containerRef.current;

    const loadQR = async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;

      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data,
        dotsOptions: {
          color: "#000",
          type: "dots",
        },
        cornersDotOptions: {
          type: "dot",
        },
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
