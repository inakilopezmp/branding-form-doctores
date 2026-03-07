/**
 * Parsea el color principal a partir de coloresPreferidos del formulario.
 * Usar esta función tanto para las plantillas (tarjeta, receta) como para
 * el prompt de generación de logos, así el color del logo y el de las
 * plantillas es exactamente el mismo.
 */
export function parseAccentColor(coloresPreferidos?: string): string {
  if (!coloresPreferidos?.trim()) return "#6556F2";
  const s = coloresPreferidos.trim().toLowerCase();
  if (s.startsWith("#") && /^#[0-9A-Fa-f]{3,6}$/.test(s)) return s;
  if (s.includes("azul")) return "#2563eb";
  if (s.includes("verde")) return "#059669";
  if (s.includes("rojo") || s.includes("carmesí")) return "#dc2626";
  if (s.includes("gris")) return "#475569";
  return "#6556F2";
}

/** Descripción verbal del color para el prompt de IA (Imagen no tiene parámetro HEX directo). */
export function hexToColorDescription(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (r > 200 && g < 100 && b < 100) return "rojo intenso";
  if (r < 100 && g > 180 && b < 100) return "verde intenso";
  if (r < 100 && g < 100 && b > 200) return "azul intenso";
  if (r > 180 && g > 180 && b < 100) return "amarillo o dorado";
  if (r < 80 && g < 80 && b < 80) return "gris oscuro o negro";
  if (r > 150 && g < 120 && b > 180) return "púrpura o violeta";
  if (hex === "#6556F2" || (r >= 90 && r <= 110 && g >= 80 && g <= 90 && b >= 235 && b <= 250)) return "violeta/púrpura azulado";
  if (r >= 35 && r <= 45 && g >= 95 && g <= 110 && b >= 230 && b <= 245) return "azul eléctrico";
  return "color sólido y uniforme";
}
