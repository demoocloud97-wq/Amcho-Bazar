// One-time importer for Season 2 (previous year) stalls.
// Triggered from the Admin page. Idempotent: skips if season-2 stalls exist.
import { getCategories, createCategory } from "./categories-db";
import { createStall, getStallsBySeason } from "./stalls-db";

const SEASON = 2;

// Google Drive `uc?export=view&id=…` links don't hotlink reliably in <img>.
// The lh3 CDN form does. Files must be shared "anyone with the link".
function driveDirect(url: string): string {
  const id = url.match(/[?&]id=([^&]+)/)?.[1] ?? url.match(/\/d\/([^/=?]+)/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1000` : url;
}

// Emoji for categories that may not exist yet (auto-created on import).
const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍲", Jewellery: "💍", Beauty: "💄", Clothing: "👗", Kids: "🧸",
  Stationery: "✏️", Handmade: "🧵", Gifts: "🎁", Shopping: "🛍️", Games: "🎮",
};

type SeedStall = { name: string; category: string; imageUrl: string };

const STALLS: SeedStall[] = [
  { name: "Abaan Nawaity Tradition", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=16zSJFt_LuxFdsPv8cICsDCh9QuXEw6O6" },
  { name: "Adan Jewels", category: "Jewellery", imageUrl: "https://drive.google.com/uc?export=view&id=1jpip9XbNMzHjaCt4grFQM_5JpwQ4bNif" },
  { name: "Adorn", category: "Jewellery", imageUrl: "https://drive.google.com/uc?export=view&id=1OvlP_lSdS7ALPWyvW41Rs2P0x_3MwTJe" },
  { name: "Amchai Dhaba", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1tO1KYw8zudv_spcH3ID5AHmls7hHgxK8" },
  { name: "Amche Gawi Jawun", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1JUpprj8evYdDZv902iocmZj4dufl5T5A" },
  { name: "Amchi Biryani Amcho Cake", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1McpxK5Bv9nLJyhwC1Okx5B_1rLlczGV8" },
  { name: "Amcho Platter", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1eNqLXF26FAJCs3kB8kChwboBBeOjNxTA" },
  { name: "Beauty & Essentials", category: "Beauty", imageUrl: "https://drive.google.com/uc?export=view&id=1QfEi6bqZpyKpdqCPYbiHuak2M_wgoLCf" },
  { name: "Beverages Corner", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1U18UkS7PQYh41bGkp0kx-NfNWM_nf6ZN" },
  { name: "Blissful Surprises", category: "Gifts", imageUrl: "https://drive.google.com/uc?export=view&id=1YSV3Zs6tZZJ_75sbxZr6uOEKG5UnFtF-" },
  { name: "Calligrapher's Studio", category: "Stationery", imageUrl: "https://drive.google.com/uc?export=view&id=1sAE1EyvZMlH1HVFSwr1AaMeA789rUjx4" },
  { name: "Crave Corner", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1pbVJgPQeebSaKQdFby616NWCS_v-DIqz" },
  { name: "Crispy Bites", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1zDJoOFotoV52eO1BnqM2yN56ILauz4bl" },
  { name: "Delicious Foods", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1HH7QPOppuiP0NeOsfkCEyEaOr6CHFpzN" },
  { name: "Fair Shine Herbal Products", category: "Beauty", imageUrl: "https://drive.google.com/uc?export=view&id=180Ejm7M5_0kW5ou8p-0LjbyWcasAjYdF" },
  { name: "Foodi", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1HP2BXIdovaJYFW23REAwS0kf9txFNEVn" },
  { name: "Food N Mood", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1GvMxhxM9aARwaKW8PiczgzNef0RjmXhm" },
  { name: "Gehna Fashion", category: "Clothing", imageUrl: "https://drive.google.com/uc?export=view&id=1VYClOnS3qWoMWSWOF4EyMI2CfL06MzxV" },
  { name: "Gems & Glow", category: "Jewellery", imageUrl: "https://drive.google.com/uc?export=view&id=1vdDCiyJwt1aqCCOVVfDsoq5zSblut0UD" },
  { name: "Hamna Food Stall", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1t-KAyaO-s2yiHzbY3q2uE2enZsxZRdJo" },
  { name: "Irfana Jewelry Collection", category: "Jewellery", imageUrl: "https://drive.google.com/uc?export=view&id=1ZvR1-Hrwe2B-G4sCouy9fzbdcRaM40Y3" },
  { name: "IS Jewellery and Makeup", category: "Jewellery", imageUrl: "https://drive.google.com/uc?export=view&id=1iw80jCp2WX4B9Dwqp0FEy3PyX_bRBgN8" },
  { name: "Kababee Express", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1Xt4RV_H1d8N6SqkJjwCi5IfVPGzyFJlX" },
  { name: "Khaana Peena", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1l7UjobEcbFyXb75hU97-GHVQG_W1mBkr" },
  { name: "Khana Peena", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1jOeDa5UC-kEKXZlgAgh7YI7S_KiJ0fd4" },
  { name: "Khausey by Walk N Roll", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1SKv9GmMAeSC5rghu1_cR-ZSLOwgjP8PC" },
  { name: "Khausay Station", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1T6SqnnOVzWUb2Orz24SqTK3dsh90J8Xa" },
  { name: "Khushiyon ki Meethas", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1KBnpf69fKzkRvMpf44ccHgXvx6UXrGiX" },
  { name: "Kids Kraze", category: "Kids", imageUrl: "https://drive.google.com/uc?export=view&id=1bswYspObuDNnPrt8DHwBkCEmij5Zljv1" },
  { name: "Little Stars", category: "Kids", imageUrl: "https://drive.google.com/uc?export=view&id=1-sjQNW9kzHZIHz_DIKI3lcfuocvTLHCc" },
  { name: "Mantasha Food & Games", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1-yq9HX8ghxbCZCaEQGdiIT0mFlEL3EPZ" },
  { name: "Mirchili", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1s-hzdLQHHsux4qb-HGQhTtWZ9TJk2R6q" },
  { name: "MS Store", category: "Shopping", imageUrl: "https://drive.google.com/uc?export=view&id=1q9jd28UuIqnThU0aP610Qh-_fw8-sY2K" },
  { name: "Nawaiti Snacks", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1_6FoOBEYb59bzJCl8c86wOKXw-vLc_OP" },
  { name: "Play To Win It", category: "Games", imageUrl: "https://drive.google.com/uc?export=view&id=19oSqpQv4-nnH7tlnRTotX0R4dR-NdN3r" },
  { name: "Resin Wave", category: "Clothing", imageUrl: "https://drive.google.com/uc?export=view&id=14GreCXos91khbLW09rcU_ug-FFYvUsvh" },
  { name: "Sadiqa's Seafood & Chatkharay", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1hRU9ORZFIDkwWlJScPqu1Y91ycSP6Cmx" },
  { name: "Shiroor Stall", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1flgfTdkP_eljG14x799oYumasG76swhv" },
  { name: "S.M. Foods", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=10XwX3JNUwG8eE_R0uFnm8tVir1vOERf6" },
  { name: "Taste Fusion", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1G0GfsUUcdlHpUZGUt80Z9ROUOtFZLjLG" },
  { name: "Taste Of Arabia", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=11v_DaNp07BagOXBkE1VDnneL4RTV8w-9" },
  { name: "The Little Shine Collection", category: "Stationery", imageUrl: "https://drive.google.com/uc?export=view&id=1AhkDGd0gpwnzXehfVU2EpXhGFqZXeIjv" },
  { name: "Total Craft", category: "Handmade", imageUrl: "https://drive.google.com/uc?export=view&id=1pyHQ_43UhEK6oqHDd-Tb98UC6H4NKyYi" },
  { name: "Usman Hot and Chilled Place", category: "Food", imageUrl: "https://drive.google.com/uc?export=view&id=1HOuwLlHptspr3nfMmEhlQOZWBc_AN5kc" },
  { name: "Zainab's Collection", category: "Clothing", imageUrl: "https://drive.google.com/uc?export=view&id=1M9Od_gJv0Tvku5RnaBGuldPTHPCTdyL7" },
  { name: "Zeen Gift Center", category: "Gifts", imageUrl: "https://drive.google.com/uc?export=view&id=1R3-Cmh90-6yFHEOybyJUL5tWp0uSpccR" },
];

// Season 2 stall photos, shaped for the Gallery page (src + caption).
export const SEASON2_GALLERY = STALLS.map((s) => ({ src: driveDirect(s.imageUrl), caption: s.name }));

export type SeedResult = { created: number; categoriesCreated: string[]; skipped: boolean };

export async function seedPreviousStalls(): Promise<SeedResult> {
  // Idempotency guard — don't double-import.
  const existing = await getStallsBySeason(SEASON);
  if (existing.length > 0) return { created: 0, categoriesCreated: [], skipped: true };

  const cats = await getCategories();
  const idByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id!]));
  const categoriesCreated: string[] = [];

  // Ensure every referenced category exists.
  for (const name of new Set(STALLS.map((s) => s.category))) {
    if (!idByName.has(name.toLowerCase())) {
      const id = await createCategory({ name, emoji: CATEGORY_EMOJI[name] ?? "🏷️", description: "", status: "active" });
      idByName.set(name.toLowerCase(), id);
      categoriesCreated.push(name);
    }
  }

  let created = 0;
  for (const s of STALLS) {
    await createStall({
      name: s.name,
      owner: "",
      status: "assigned",
      season: SEASON,
      categoryId: idByName.get(s.category.toLowerCase())!,
      subcategoryId: null,
      imageUrl: driveDirect(s.imageUrl),
    });
    created++;
  }

  return { created, categoriesCreated, skipped: false };
}
