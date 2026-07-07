export const EVENT = {
  name: "Amcho Bazar",
  season: "Season 3",
  seasonNumber: 3,
  tagline: "Amchi Market, Amchi Manshay",
  organizer: "Nawait Community",
  city: "Bhatkal, Karnataka",
  venue: "Nawait Community Hall, Nawayath Colony",
  dateISO: "2026-08-02T10:00:00",
  dateLabel: "August 2, 2026 · 10:00 AM – 9:00 PM",
  registeredSellers: 120,
  totalStalls: 75,
  totalWinners: 45,
  registrationFee: 1500,
};

export const STATS = [
  { label: "Women Entrepreneurs", value: 120, suffix: "+" },
  { label: "Local Home Businesses", value: 90, suffix: "" },
  { label: "Community Volunteers", value: 45, suffix: "" },
];

export type CategoryKey =
  | "Food"
  | "Clothing"
  | "Jewellery"
  | "Household"
  | "Beauty"
  | "Stationery"
  | "Kids"
  | "Handmade"
  | "Others";

export const CATEGORIES: {
  key: CategoryKey;
  emoji: string;
  sellers: number;
  description: string;
  hue: string;
}[] = [
  { key: "Food", emoji: "🍲", sellers: 22, description: "Home kitchens, festive sweets, fresh bakes and Bhatkali specialties.", hue: "from-orange to-gold" },
  { key: "Clothing", emoji: "👗", sellers: 18, description: "Modest wear, hand-embroidered abayas, tunics and everyday elegance.", hue: "from-maroon to-orange" },
  { key: "Jewellery", emoji: "💍", sellers: 14, description: "Handcrafted silver, resin art, beadwork and heirloom-inspired pieces.", hue: "from-gold to-orange" },
  { key: "Household", emoji: "🏺", sellers: 9, description: "Home décor, kitchen essentials, candles and thoughtful gifting.", hue: "from-teal to-maroon" },
  { key: "Beauty", emoji: "🌸", sellers: 11, description: "Natural skincare, henna, halal cosmetics and self-care rituals.", hue: "from-orange to-maroon" },
  { key: "Stationery", emoji: "✒️", sellers: 6, description: "Islamic art prints, planners, calligraphy and children's journals.", hue: "from-teal to-gold" },
  { key: "Kids", emoji: "🧸", sellers: 12, description: "Soft toys, learning kits, modest kidswear and party favours.", hue: "from-gold to-teal" },
  { key: "Handmade", emoji: "🧶", sellers: 15, description: "Crochet, resin, embroidery and small-batch artisan finds.", hue: "from-maroon to-teal" },
  { key: "Others", emoji: "✨", sellers: 13, description: "Everything wonderful that doesn't fit a single box.", hue: "from-orange to-gold" },
];

const firstNames = ["Ayesha","Fatima","Zainab","Khadija","Ruqayya","Sumayya","Aisha","Hafsa","Mariam","Safiya","Rida","Sana","Farheen","Nusrat","Zoya","Amina","Iqra","Hiba","Nazneen","Shabana","Rabia","Noor","Yasmeen","Tahira","Umme","Shaista","Nabila","Sameera","Lubna","Salma","Zubaida","Anisa","Rehana","Bushra","Rabeea","Rihana","Aliya","Simra","Alifa","Naila","Zeba","Munira","Shafeeqa","Kausar","Nasreen"];
const lastInitials = ["Khan","Sherif","Damudi","Muhtesim","Ronghi","Muniri","Bahri","Kola","Attar","Barmawer","Ali","Rukhna","Kashfi","Baba","Ahmed"];
const businessAdj = ["Ayesha's","Noor","Amina's","Golden","Cream","Zoya's","Bhatkali","Nawait","Home of","Little","Silk &","Rose","Henna","Blossom","Petal","Amber","Saffron","Mehendi","Suraiya's","Rida's"];
const businessNoun = ["Kitchen","Kraft","Closet","Cocoa","Bakes","Boutique","Threads","Petals","Palette","Bites","Bazaar","Beads","Studio","Home","Curations","Kids","Corner","Nook","Table","Atelier"];

function seeded(i: number) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastInitials[(i * 3) % lastInitials.length];
  const ba = businessAdj[(i * 7) % businessAdj.length];
  const bn = businessNoun[(i * 5) % businessNoun.length];
  const cat = CATEGORIES[(i * 2) % CATEGORIES.length].key;
  return {
    id: `S${(i + 1).toString().padStart(3, "0")}`,
    seller: `${fn} ${ln}`,
    business: `${ba} ${bn}`,
    category: cat,
    products: sampleProducts(cat, i),
    featured: i % 11 === 0,
    avatar: `https://i.pravatar.cc/160?img=${(i % 70) + 1}`,
  };
}

function sampleProducts(cat: CategoryKey, i: number): string[] {
  const p: Record<CategoryKey, string[]> = {
    Food: ["Bhatkali biryani", "Sannas", "Coconut ladoos", "Kheema samosa", "Karachi halwa", "Date rolls"],
    Clothing: ["Hand-embroidered abaya", "Cotton tunics", "Kids' kurtas", "Modest maxi", "Silk scarves"],
    Jewellery: ["Resin earrings", "Silver anklets", "Beaded chokers", "Pearl studs", "Boho rings"],
    Household: ["Soy candles", "Ceramic mugs", "Cushion covers", "Woven baskets", "Table runners"],
    Beauty: ["Rose face mist", "Halal lipstick", "Henna cones", "Ubtan bar", "Kohl kajal"],
    Stationery: ["Ayah wall art", "Weekly planner", "Kids' Arabic tracer", "Duas journal"],
    Kids: ["Crochet lovie", "Wooden puzzle", "Modest tot dress", "Story board book"],
    Handmade: ["Macrame wall art", "Crochet tote", "Resin coasters", "Embroidered patch"],
    Others: ["Perfume oils", "Prayer beads", "Islamic gifts"],
  };
  const arr = p[cat];
  return [arr[i % arr.length], arr[(i + 2) % arr.length], arr[(i + 4) % arr.length]].filter(Boolean);
}

export const SELLERS = Array.from({ length: EVENT.registeredSellers }, (_, i) => seeded(i));

// Pre-assign 12 stalls so the venue map starts partially lit for demo realism
export const PRE_ASSIGNED = 0;

export const FAQS = [
  { q: "Who can attend Amcho Bazar?", a: "Amcho Bazar is a women-only event. Women and children of all ages are warmly welcome. Boys under 10 may accompany their mothers." },
  { q: "Is there an entry fee for visitors?", a: "Entry for visitors is completely free. Come with your friends, family and neighbours." },
  { q: "Where is the event held?", a: "Nawait Community Hall, Nawayath Colony, Bhatkal — with ample parking and prayer facilities on site." },
  { q: "How do I register as a seller?", a: "Head to Become a Seller, complete the 5-step registration and wait for confirmation. A live draw assigns stalls fairly." },
  { q: "What is the registration fee?", a: "Rs 1,500 covers the stall, table, chair, décor kit and marketing for the day. Payment is only after your registration is approved." },
  { q: "What if my registration is on the waiting list?", a: "You'll be automatically upgraded if a stall opens up. Waiting-list sellers are also invited to the community pop-up in Season 3." },
];

export const GALLERY = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  src: `https://images.unsplash.com/photo-${[
    "1523240795612-9a054b0db644",
    "1555854877-bab0e564b8d5",
    "1533900298318-6b8da08a523e",
    "1503424886302-63b60ea16dea",
    "1541535650810-10d26f5c2ab7",
    "1591189824344-9b18fe62dcb2",
    "1519741497674-611481863552",
    "1526401485004-46910ecc8e51",
    "1470309864661-68328b2cd0a5",
    "1509440159596-0249088772ff",
    "1517686469429-8bdb88b9f907",
    "1481280032417-d0821c58e005",
    "1516685304081-de7947d419d5",
    "1533777857889-4be7c70b33f7",
  ][i]}?auto=format&fit=crop&w=${i % 3 === 0 ? 900 : 700}&q=80`,
  caption: [
    "Opening ribbon — Season 2",
    "Ayesha's biryani stall",
    "Handmade jewellery corner",
    "Little visitors, big smiles",
    "Henna & self-care",
    "The community kitchen",
    "Craft workshop for kids",
    "Golden hour at the bazaar",
    "Nawait volunteers",
    "Silk & stitches",
    "Sweet treats",
    "The gifting corner",
    "Sisterhood in action",
    "Season 2 finale",
  ][i],
  span: i % 5 === 0 ? "tall" : i % 4 === 0 ? "wide" : "sq",
}));

export const HIGHLIGHTS = [
  { year: "Season 2 · 2025", title: "Doubled, elevated, celebrated", body: "120 registered sellers, 75 stalls, one grand community draw ceremony — and a whole festival built around each one of them." },
  { year: "Season 3 · 2026", title: "Bigger, warmer, closer", body: "August 2 — our third season returns to Nawait Community Hall with more sellers, more stalls and the same sisterhood at heart." },
];

export const GUIDELINES = [
  { icon: "👩‍👧", title: "Women & children only", body: "A safe, warm space by design. Little ones are welcome; boys under 10 may accompany their mothers." },
  { icon: "🧕", title: "Modest, comfortable dress", body: "Come as you are — abayas, hijabs, casuals; whatever lets you enjoy the day." },
  { icon: "🛍️", title: "Bring cloth bags", body: "Help us stay plastic-free. Reusable bags are available at the entry desk." },
  { icon: "📸", title: "Photography etiquette", body: "Please ask before photographing other visitors. Designated photo corners are open to all." },
  { icon: "🕌", title: "Prayer & feeding rooms", body: "Dedicated spaces are available near the main hall throughout the day." },
  { icon: "🅿️", title: "Parking", body: "Free parking for the first 300 vehicles; overflow parking at Anjuman ground." },
];

export const ADMIN_ACTIVITY = [
  { time: "2 min ago", who: "Fatima Sherif", what: "completed payment for stall #24" },
  { time: "18 min ago", who: "Zainab Khan", what: "submitted registration in category Beauty" },
  { time: "1 hr ago", who: "Draw Ceremony", what: "assigned stall #17 to Ayesha's Kitchen" },
  { time: "3 hr ago", who: "Ruqayya Muniri", what: "moved to waiting list" },
  { time: "Today", who: "Admin", what: "approved 12 new registrations" },
];