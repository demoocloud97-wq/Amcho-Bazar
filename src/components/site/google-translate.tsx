import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown, Search } from "lucide-react";

// Full Google Translate language set. `label` = native, `name` = English (for search).
// Local audience languages pinned to the top; the rest are alphabetical.
const LANGS: { code: string; label: string; name: string }[] = [
  { code: "en", label: "English", name: "English" },
  { code: "ur", label: "اردو", name: "Urdu" },
  { code: "hi", label: "हिन्दी", name: "Hindi" },
  { code: "ar", label: "العربية", name: "Arabic" },
  { code: "af", label: "Afrikaans", name: "Afrikaans" },
  { code: "sq", label: "Shqip", name: "Albanian" },
  { code: "am", label: "አማርኛ", name: "Amharic" },
  { code: "hy", label: "Հայերեն", name: "Armenian" },
  { code: "az", label: "Azərbaycan", name: "Azerbaijani" },
  { code: "eu", label: "Euskara", name: "Basque" },
  { code: "be", label: "Беларуская", name: "Belarusian" },
  { code: "bn", label: "বাংলা", name: "Bengali Bangla" },
  { code: "bs", label: "Bosanski", name: "Bosnian" },
  { code: "bg", label: "Български", name: "Bulgarian" },
  { code: "ca", label: "Català", name: "Catalan" },
  { code: "ceb", label: "Cebuano", name: "Cebuano" },
  { code: "ny", label: "Chichewa", name: "Chichewa" },
  { code: "zh-CN", label: "简体中文", name: "Chinese Simplified" },
  { code: "zh-TW", label: "繁體中文", name: "Chinese Traditional" },
  { code: "co", label: "Corsu", name: "Corsican" },
  { code: "hr", label: "Hrvatski", name: "Croatian" },
  { code: "cs", label: "Čeština", name: "Czech" },
  { code: "da", label: "Dansk", name: "Danish" },
  { code: "nl", label: "Nederlands", name: "Dutch" },
  { code: "eo", label: "Esperanto", name: "Esperanto" },
  { code: "et", label: "Eesti", name: "Estonian" },
  { code: "tl", label: "Filipino", name: "Filipino Tagalog" },
  { code: "fi", label: "Suomi", name: "Finnish" },
  { code: "fr", label: "Français", name: "French" },
  { code: "fy", label: "Frysk", name: "Frisian" },
  { code: "gl", label: "Galego", name: "Galician" },
  { code: "ka", label: "ქართული", name: "Georgian" },
  { code: "de", label: "Deutsch", name: "German" },
  { code: "el", label: "Ελληνικά", name: "Greek" },
  { code: "gu", label: "ગુજરાતી", name: "Gujarati" },
  { code: "ht", label: "Kreyòl Ayisyen", name: "Haitian Creole" },
  { code: "ha", label: "Hausa", name: "Hausa" },
  { code: "haw", label: "ʻŌlelo Hawaiʻi", name: "Hawaiian" },
  { code: "iw", label: "עברית", name: "Hebrew" },
  { code: "hmn", label: "Hmong", name: "Hmong" },
  { code: "hu", label: "Magyar", name: "Hungarian" },
  { code: "is", label: "Íslenska", name: "Icelandic" },
  { code: "ig", label: "Igbo", name: "Igbo" },
  { code: "id", label: "Indonesia", name: "Indonesian" },
  { code: "ga", label: "Gaeilge", name: "Irish" },
  { code: "it", label: "Italiano", name: "Italian" },
  { code: "ja", label: "日本語", name: "Japanese" },
  { code: "jw", label: "Basa Jawa", name: "Javanese" },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada" },
  { code: "kk", label: "Қазақ", name: "Kazakh" },
  { code: "km", label: "ខ្មែរ", name: "Khmer" },
  { code: "ko", label: "한국어", name: "Korean" },
  { code: "ku", label: "Kurdî", name: "Kurdish Kurmanji" },
  { code: "ky", label: "Кыргызча", name: "Kyrgyz" },
  { code: "lo", label: "ລາວ", name: "Lao" },
  { code: "la", label: "Latina", name: "Latin" },
  { code: "lv", label: "Latviešu", name: "Latvian" },
  { code: "lt", label: "Lietuvių", name: "Lithuanian" },
  { code: "lb", label: "Lëtzebuergesch", name: "Luxembourgish" },
  { code: "mk", label: "Македонски", name: "Macedonian" },
  { code: "mg", label: "Malagasy", name: "Malagasy" },
  { code: "ms", label: "Melayu", name: "Malay" },
  { code: "ml", label: "മലയാളം", name: "Malayalam" },
  { code: "mt", label: "Malti", name: "Maltese" },
  { code: "mi", label: "Māori", name: "Maori" },
  { code: "mr", label: "मराठी", name: "Marathi" },
  { code: "mn", label: "Монгол", name: "Mongolian" },
  { code: "my", label: "မြန်မာ", name: "Myanmar Burmese" },
  { code: "ne", label: "नेपाली", name: "Nepali" },
  { code: "no", label: "Norsk", name: "Norwegian" },
  { code: "ps", label: "پښتو", name: "Pashto" },
  { code: "fa", label: "فارسی", name: "Persian Farsi" },
  { code: "pl", label: "Polski", name: "Polish" },
  { code: "pt", label: "Português", name: "Portuguese" },
  { code: "pa", label: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { code: "ro", label: "Română", name: "Romanian" },
  { code: "ru", label: "Русский", name: "Russian" },
  { code: "sm", label: "Gagana Samoa", name: "Samoan" },
  { code: "gd", label: "Gàidhlig", name: "Scots Gaelic" },
  { code: "sr", label: "Српски", name: "Serbian" },
  { code: "st", label: "Sesotho", name: "Sesotho" },
  { code: "sn", label: "Shona", name: "Shona" },
  { code: "sd", label: "سنڌي", name: "Sindhi" },
  { code: "si", label: "සිංහල", name: "Sinhala" },
  { code: "sk", label: "Slovenčina", name: "Slovak" },
  { code: "sl", label: "Slovenščina", name: "Slovenian" },
  { code: "so", label: "Soomaali", name: "Somali" },
  { code: "es", label: "Español", name: "Spanish" },
  { code: "su", label: "Basa Sunda", name: "Sundanese" },
  { code: "sw", label: "Kiswahili", name: "Swahili" },
  { code: "sv", label: "Svenska", name: "Swedish" },
  { code: "tg", label: "Тоҷикӣ", name: "Tajik" },
  { code: "ta", label: "தமிழ்", name: "Tamil" },
  { code: "te", label: "తెలుగు", name: "Telugu" },
  { code: "th", label: "ไทย", name: "Thai" },
  { code: "tr", label: "Türkçe", name: "Turkish" },
  { code: "uk", label: "Українська", name: "Ukrainian" },
  { code: "uz", label: "Oʻzbek", name: "Uzbek" },
  { code: "vi", label: "Tiếng Việt", name: "Vietnamese" },
  { code: "cy", label: "Cymraeg", name: "Welsh" },
  { code: "xh", label: "isiXhosa", name: "Xhosa" },
  { code: "yi", label: "ייִדיש", name: "Yiddish" },
  { code: "yo", label: "Yorùbá", name: "Yoruba" },
  { code: "zu", label: "isiZulu", name: "Zulu" },
];

// Current language comes from Google's `googtrans` cookie (/en/<code>).
function readCurrent(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/);
  return m?.[1] ?? "en";
}

// A custom, branded dropdown that drives the hidden Google Translate <select>.
export function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("en");
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Load Google's widget once (into a visually-hidden mount).
  useEffect(() => {
    setCur(readCurrent());
    if (document.getElementById("google-translate-script")) return;
    (window as any).googleTranslateElementInit = () => {
      const g = (window as any).google;
      if (!g?.translate?.TranslateElement) return;
      // No includedLanguages ⇒ Google offers its full language set.
      new g.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function pick(code: string) {
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change"));
    }
    setCur(code);
    setOpen(false);
    setQ("");
  }

  const curLabel = LANGS.find((l) => l.code === cur)?.label ?? "English";
  const query = q.trim().toLowerCase();
  const shown = query
    ? LANGS.filter((l) => l.label.toLowerCase().includes(query) || l.name.toLowerCase().includes(query) || l.code.includes(query))
    : LANGS;

  return (
    <div ref={ref} className="notranslate relative" translate="no">
      {/* Hidden Google mount — keeps the functional <select> in the DOM. */}
      <div id="google_translate_element" className="sr-only" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="max-w-[7rem] truncate">{curLabel}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute end-0 z-50 mt-2 flex max-h-[70vh] w-56 flex-col rounded-2xl border border-border bg-popover p-1.5 shadow-card"
        >
          <div className="relative p-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search language…"
              className="w-full rounded-xl border border-border bg-muted/40 py-2 pe-3 ps-9 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </div>
          <div className="mt-1 overflow-auto">
            {shown.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No language found</div>
            ) : (
              shown.map((l) => {
                const active = l.code === cur;
                return (
                  <button
                    key={l.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(l.code)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted"}`}
                  >
                    <span>{l.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
