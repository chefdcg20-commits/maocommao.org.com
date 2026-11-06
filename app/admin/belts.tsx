// Faixas do projeto (infantil e adulto). Chave = valor gravado no banco (coluna belt).
export type Belt = { key: string; label: string; main: string; stripe?: string };

export const BELTS: Belt[] = [
  { key: "white", label: "Branca", main: "#f4f4f5" },
  { key: "grey_white", label: "Cinza e branca", main: "#9ca3af", stripe: "#f4f4f5" },
  { key: "grey", label: "Cinza", main: "#9ca3af" },
  { key: "grey_black", label: "Cinza e preta", main: "#9ca3af", stripe: "#111111" },
  { key: "yellow_white", label: "Amarela e branca", main: "#facc15", stripe: "#f4f4f5" },
  { key: "yellow", label: "Amarela", main: "#facc15" },
  { key: "yellow_black", label: "Amarela e preta", main: "#facc15", stripe: "#111111" },
  { key: "orange_white", label: "Laranja e branca", main: "#f97316", stripe: "#f4f4f5" },
  { key: "orange", label: "Laranja", main: "#f97316" },
  { key: "orange_black", label: "Laranja e preta", main: "#f97316", stripe: "#111111" },
  { key: "green_white", label: "Verde e branca", main: "#16a34a", stripe: "#f4f4f5" },
  { key: "green", label: "Verde", main: "#16a34a" },
  { key: "green_black", label: "Verde e preta", main: "#16a34a", stripe: "#111111" },
  { key: "blue", label: "Azul", main: "#2563eb" },
  { key: "purple", label: "Roxa", main: "#7e22ce" },
  { key: "brown", label: "Marrom", main: "#78350f" },
  { key: "black", label: "Preta", main: "#111111" },
];

export const beltByKey = (key: string | null | undefined) => BELTS.find((belt) => belt.key === key);

// Faixa com no, pontas penduradas, listra central (faixas de duas cores) e barra com graus.
export function BeltGraphic({ belt, stripes = 0, className = "" }: { belt: Belt; stripes?: number; className?: string }) {
  const bar = belt.key === "black" ? "#b91c1c" : "#111111";
  const edge = "rgba(0,0,0,0.45)";
  return (
    <svg viewBox="0 0 120 40" className={className} role="img" aria-label={`Faixa ${belt.label}`}>
      {/* pontas penduradas */}
      <polygon points="52,22 62,22 56,38 46,36" fill={belt.main} stroke={edge} strokeWidth="0.8" />
      <polygon points="58,22 68,22 76,36 66,38" fill={belt.main} stroke={edge} strokeWidth="0.8" />
      {/* faixa */}
      <rect x="2" y="10" width="116" height="13" rx="1.5" fill={belt.main} stroke={edge} strokeWidth="0.8" />
      {belt.stripe && <rect x="2.4" y="14.7" width="115.2" height="3.6" fill={belt.stripe} />}
      {/* barra do lado direito, com os graus */}
      <rect x="92" y="10" width="20" height="13" fill={bar} stroke={edge} strokeWidth="0.8" />
      {Array.from({ length: Math.max(0, Math.min(4, stripes)) }).map((_, i) => (
        <rect key={i} x={95 + i * 4.2} y="10" width="2.4" height="13" fill="#f4f4f5" />
      ))}
      {/* no */}
      <rect x="49" y="6" width="22" height="21" rx="4" fill={belt.main} stroke={edge} strokeWidth="0.8" />
      <path d="M52 12 Q60 17 68 12 M52 21 Q60 16 68 21" stroke={edge} strokeWidth="0.9" fill="none" />
    </svg>
  );
}
