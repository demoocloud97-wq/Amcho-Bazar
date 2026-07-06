// Shared category palette for the draw arena + presentation venue map.
export const CATEGORY_COLORS: Record<string, { bg: string; ring: string; canopy: string; label: string }> = {
  Food:       { bg: "#F26B2A", ring: "rgba(242,107,42,0.55)",  canopy: "#C24E17", label: "Food" },
  Clothing:   { bg: "#8B5CF6", ring: "rgba(139,92,246,0.55)",  canopy: "#5B21B6", label: "Clothing" },
  Jewellery:  { bg: "#FFC94A", ring: "rgba(255,201,74,0.6)",   canopy: "#B8860B", label: "Jewellery" },
  Beauty:     { bg: "#EC4899", ring: "rgba(236,72,153,0.55)",  canopy: "#9D174D", label: "Beauty" },
  Household:  { bg: "#22C55E", ring: "rgba(34,197,94,0.55)",   canopy: "#15803D", label: "Household" },
  Kids:       { bg: "#3B82F6", ring: "rgba(59,130,246,0.55)",  canopy: "#1D4ED8", label: "Kids" },
  Handmade:   { bg: "#A16207", ring: "rgba(161,98,7,0.55)",    canopy: "#5C3A08", label: "Handmade" },
  Stationery: { bg: "#1FA7A6", ring: "rgba(31,167,166,0.55)",  canopy: "#0E5F5E", label: "Stationery" },
  Others:     { bg: "#7A1E3D", ring: "rgba(122,30,61,0.55)",   canopy: "#4A0E23", label: "Others" },
};

export const colorFor = (category: string) => CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Others;
