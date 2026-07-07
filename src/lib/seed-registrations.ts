import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

// Name pools for believable dummy sellers (women-only community festival).
const FIRST = ["Ayesha", "Fatima", "Zainab", "Khadija", "Ruqayya", "Sumayya", "Aisha", "Hafsa", "Mariam", "Safiya", "Rida", "Sana", "Farheen", "Nusrat", "Zoya", "Amina", "Iqra", "Hiba", "Nazneen", "Shabana", "Rabia", "Noor", "Yasmeen", "Tahira", "Shaista", "Nabila", "Sameera", "Lubna", "Salma", "Zubaida", "Anisa", "Rehana", "Bushra", "Aliya", "Simra", "Naila", "Zeba", "Munira", "Kausar", "Nasreen", "Hooria", "Mahnoor", "Areeba", "Komal", "Sadia"];
const LAST = ["Khan", "Sheikh", "Malik", "Butt", "Qureshi", "Ansari", "Baig", "Chaudhry", "Awan", "Siddiqui", "Rana", "Bhatti", "Memon", "Zafar", "Hashmi"];
const ADJ = ["Ayesha's", "Noor", "Golden", "Cream", "Zoya's", "Home of", "Little", "Silk &", "Rose", "Henna", "Blossom", "Amber", "Saffron", "Mehendi", "Rida's", "Pearl", "Velvet", "Suneri"];
const NOUN = ["Kitchen", "Kraft", "Closet", "Bakes", "Boutique", "Threads", "Petals", "Palette", "Bites", "Bazaar", "Beads", "Studio", "Curations", "Corner", "Nook", "Table", "Atelier", "Treats"];
const CATS = ["Food", "Clothing", "Jewellery", "Beauty", "Kids", "Handmade", "Gifts", "Household", "Stationery"];
const PRODUCTS: Record<string, string[]> = {
  Food: ["Biryani", "Samosas", "Karachi halwa", "Cupcakes"],
  Clothing: ["Abayas", "Kurtis", "Dupattas", "Kids' wear"],
  Jewellery: ["Resin earrings", "Bangles", "Chokers", "Rings"],
  Beauty: ["Henna cones", "Lip tints", "Face packs", "Kajal"],
  Kids: ["Toys", "Story books", "Party favours"],
  Handmade: ["Crochet", "Coasters", "Wall art"],
  Gifts: ["Gift boxes", "Candles", "Hampers"],
  Household: ["Crockery", "Storage", "Décor"],
  Stationery: ["Planners", "Art prints", "Journals"],
};

// One-time dev seed: create `count` approved registrations for a season so the
// draw pool is populated. Uses a single batched write. Returns rows created.
export async function seedApprovedRegistrations(seasonId: string, seasonNumber: number, count: number): Promise<number> {
  const batch = writeBatch(db);
  for (let i = 0; i < count; i++) {
    const category = CATS[(i * 2) % CATS.length];
    const ref = doc(collection(db, "registrations"));
    batch.set(ref, {
      eventId: AMCHO_BAZAR_EVENT_ID,
      seasonId,
      season: seasonNumber,
      seller: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
      business: `${ADJ[(i * 7) % ADJ.length]} ${NOUN[(i * 5) % NOUN.length]}`,
      category,
      categories: [category],
      phone: `03${String(100000000 + i).slice(0, 9)}`,
      products: PRODUCTS[category] ?? [],
      status: "approved",
      isSeedDummy: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return count;
}
