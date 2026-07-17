import type { Lang } from "./i18n";

// In-app help content shown by <HelpButton> and the /guide page. Each string is
// localized; `en` is required, other languages fall back to `en` when missing.
export type Who = "all" | "seller" | "admin";
type L = { en: string } & Partial<Record<Lang, string>>;
export type GuideSection = { title: L; route?: string; who: Who[]; steps: L[]; tip?: L };

// Pick the string for the active language (falls back to English).
export const gt = (l: L | undefined, lang: Lang): string => (l ? l[lang] ?? l.en : "");

export const GUIDE_ORDER = ["home", "signup", "register", "reginfo", "stalls", "gallery", "categories", "draw", "admin", "seasons", "payments", "announcements", "reports", "settings"] as const;

export const WHO_LABEL: Record<Who, L> = {
  all: { en: "Everyone", ur: "سب کے لیے", "ur-roman": "Sab ke liye", hi: "सभी के लिए", ar: "للجميع" },
  seller: { en: "Seller", ur: "بیچنے والی", "ur-roman": "Seller", hi: "विक्रेता", ar: "البائعة" },
  admin: { en: "Admin", ur: "ایڈمن", "ur-roman": "Admin", hi: "एडमिन", ar: "المشرف" },
};

export const GUIDE: Record<string, GuideSection> = {
  home: {
    title: { en: "Home", ur: "ہوم", "ur-roman": "Home", hi: "होम", ar: "الرئيسية" },
    route: "/",
    who: ["all"],
    steps: [
      { en: "The landing page for the active season — its name, date and countdown come straight from the season you set Active.", ur: "فعال سیزن کا صفحہ — نام، تاریخ اور کاؤنٹ ڈاؤن اسی سیزن سے آتے ہیں جو Active ہے۔", "ur-roman": "Active season ka page — naam, date aur countdown usi season se aate hain jo Active hai.", hi: "सक्रिय सीज़न का पेज — नाम, तिथि व काउंटडाउन उसी सीज़न से।", ar: "صفحة الموسم النشط — الاسم والتاريخ والعد التنازلي من الموسم المفعّل." },
      { en: "Visitors see the seller CTA, the categories, past seasons and the event location with a map and directions.", ur: "وزیٹرز کو رجسٹریشن بٹن، زمرے، پرانے سیزن اور مقام (نقشہ و راستہ) نظر آتے ہیں۔", "ur-roman": "Visitors ko registration button, categories, purane seasons aur location (map & directions) nazar aate hain.", hi: "विज़िटर को पंजीकरण बटन, श्रेणियाँ, पुराने सीज़न और स्थान (मानचित्र व दिशा) दिखते हैं।", ar: "يرى الزوار زر التسجيل والفئات والمواسم السابقة وموقع الحدث بالخريطة والاتجاهات." },
      { en: "The seller CTA is hidden from admins — admins don't register a stall.", ur: "ایڈمن کو رجسٹریشن بٹن نہیں دکھتا — ایڈمن اسٹال رجسٹر نہیں کرتا۔", "ur-roman": "Admin ko registration button nahi dikhta — admin stall register nahi karta.", hi: "एडमिन को पंजीकरण बटन नहीं दिखता — एडमिन स्टॉल पंजीकृत नहीं करता।", ar: "زر التسجيل مخفي عن المشرفين — المشرف لا يسجّل كشكًا." },
    ],
    tip: { en: "Change what shows here from Settings: hero image, FAQ, footer contact, and Event location (venue, address, directions, date & time).", ur: "یہاں کی چیزیں Settings سے بدلیں: hero تصویر، FAQ، فوٹر رابطہ، اور Event location۔", "ur-roman": "Yahan ki cheezein Settings se badlein: hero image, FAQ, footer contact, aur Event location.", hi: "यहाँ की चीज़ें Settings से बदलें: hero छवि, FAQ, फ़ुटर संपर्क, और Event location।", ar: "غيّر ما يظهر هنا من الإعدادات: صورة البطل، الأسئلة، تذييل التواصل، وموقع الحدث." },
  },

  stalls: {
    title: { en: "Stall Directory", ur: "اسٹال ڈائریکٹری", "ur-roman": "Stall Directory", hi: "स्टॉल निर्देशिका", ar: "دليل الأكشاك" },
    route: "/stalls",
    who: ["all"],
    steps: [
      { en: "Every stall of a season, season by season — use the tabs at the top to switch.", ur: "ہر سیزن کے اسٹال — اوپر کے ٹیبز سے سیزن بدلیں۔", "ur-roman": "Har season ke stalls — upar ke tabs se season badlein.", hi: "हर सीज़न के स्टॉल — ऊपर के टैब से सीज़न बदलें।", ar: "أكشاك كل موسم — بدّل الموسم من التبويبات." },
      { en: "Search by business, owner or category, and filter with the category dropdown.", ur: "کاروبار، مالک یا زمرے سے تلاش کریں، اور زمرہ ڈراپ ڈاؤن سے فلٹر۔", "ur-roman": "Business, owner ya category se search karein, aur category dropdown se filter.", hi: "व्यवसाय, मालिक या श्रेणी से खोजें, और श्रेणी ड्रॉपडाउन से फ़िल्टर करें।", ar: "ابحث بالنشاط أو المالكة أو الفئة، وصفِّ بالقائمة المنسدلة." },
      { en: "One card per seller — if she registered in several categories, they all show as chips on that one card.", ur: "ہر seller کا ایک کارڈ — کئی زمرے ہوں تو سب اسی کارڈ پر chips میں۔", "ur-roman": "Har seller ka ek card — kai categories hon to sab usi card par chips mein.", hi: "प्रत्येक seller का एक कार्ड — कई श्रेणियाँ हों तो सब उसी कार्ड पर chips में।", ar: "بطاقة واحدة لكل بائعة — وإن سجّلت بعدة فئات تظهر كلها كرقائق على البطاقة نفسها." },
      { en: "Admin: the ⋮ menu adds bulk import, multi-select delete, or clearing a whole season.", ur: "ایڈمن: ⋮ مینو سے bulk import، multi-select delete، یا پورا سیزن clear۔", "ur-roman": "Admin: ⋮ menu se bulk import, multi-select delete, ya poora season clear.", hi: "एडमिन: ⋮ मेन्यू से bulk import, multi-select delete, या पूरा सीज़न clear।", ar: "المشرف: قائمة ⋮ للاستيراد الجماعي أو الحذف المتعدد أو مسح موسم كامل." },
    ],
    tip: { en: "Stalls appear here automatically when a seller wins the Live Draw — you don't add them by hand.", ur: "Live Draw جیتنے پر اسٹال خودبخود یہاں آتا ہے — ہاتھ سے شامل نہیں کرنا پڑتا۔", "ur-roman": "Live Draw jeetne par stall khudbakhud yahan aata hai — haath se add nahi karna parta.", hi: "Live Draw जीतने पर स्टॉल स्वतः यहाँ आता है — हाथ से जोड़ना नहीं पड़ता।", ar: "يظهر الكشك هنا تلقائيًا عند الفوز بالسحب — لا تضيفه يدويًا." },
  },

  gallery: {
    title: { en: "Gallery", ur: "گیلری", "ur-roman": "Gallery", hi: "गैलरी", ar: "المعرض" },
    route: "/gallery",
    who: ["all"],
    steps: [
      { en: "Photos from the bazaar, grouped by season.", ur: "بازار کی تصاویر، سیزن کے حساب سے۔", "ur-roman": "Bazaar ki tasveerein, season ke hisab se.", hi: "बाज़ार की तस्वीरें, सीज़न अनुसार।", ar: "صور من البازار، مرتّبة بحسب الموسم." },
      { en: "Tap any photo to open it larger.", ur: "کسی بھی تصویر پر ٹیپ کرکے بڑا دیکھیں۔", "ur-roman": "Kisi bhi tasveer par tap karke bara dekhein.", hi: "किसी भी तस्वीर पर टैप कर बड़ा देखें।", ar: "اضغط أي صورة لعرضها أكبر." },
      { en: "Admin: add photos with an image link and remove any that no longer fit.", ur: "ایڈمن: تصویر کا لنک دے کر شامل کریں، غیر ضروری ہٹا دیں۔", "ur-roman": "Admin: tasveer ka link de kar add karein, ghair-zaroori hata dein.", hi: "एडमिन: छवि लिंक से जोड़ें, अनावश्यक हटाएँ।", ar: "المشرف: أضف صورًا برابط واحذف غير المناسب." },
    ],
  },

  categories: {
    title: { en: "Categories", ur: "زمرے", "ur-roman": "Categories", hi: "श्रेणियाँ", ar: "الفئات" },
    route: "/categories",
    who: ["admin"],
    steps: [
      { en: "The master list of category types (Food, Jewellery, Clothing…) used across the whole app.", ur: "زمروں کی اصل فہرست (Food، Jewellery، Clothing…) جو پوری ایپ میں چلتی ہے۔", "ur-roman": "Categories ki asal fehrist (Food, Jewellery, Clothing…) jo poori app mein chalti hai.", hi: "श्रेणी प्रकारों की मास्टर सूची (Food, Jewellery, Clothing…) जो पूरी ऐप में चलती है।", ar: "القائمة الرئيسية لأنواع الفئات (طعام، مجوهرات، ملابس…) المستخدمة في التطبيق كله." },
      { en: "Create one with a name, emoji and description; set it Active to make it selectable.", ur: "نام، ایموجی اور تفصیل کے ساتھ بنائیں؛ Active کریں تو منتخب ہو سکے گا۔", "ur-roman": "Naam, emoji aur description ke saath banayein; Active karein to select ho sakega.", hi: "नाम, इमोजी व विवरण से बनाएँ; Active करें तो चुनी जा सकेगी।", ar: "أنشئها باسم ورمز ووصف؛ فعّلها لتصبح قابلة للاختيار." },
      { en: "Open a category to manage its sub-categories.", ur: "کسی زمرے کو کھول کر اس کے سب زمرے سنبھالیں۔", "ur-roman": "Kisi category ko khol kar uske sub-categories sambhalein.", hi: "किसी श्रेणी को खोलकर उसकी उप-श्रेणियाँ प्रबंधित करें।", ar: "افتح فئة لإدارة فئاتها الفرعية." },
      { en: "Whatever you change here shows up right away in registration, the directory and Registration Info.", ur: "یہاں کی تبدیلی فوراً رجسٹریشن، ڈائریکٹری اور Registration Info میں نظر آتی ہے۔", "ur-roman": "Yahan ki tabdeeli foran registration, directory aur Registration Info mein nazar aati hai.", hi: "यहाँ का बदलाव तुरंत पंजीकरण, निर्देशिका व Registration Info में दिखता है।", ar: "أي تغيير هنا يظهر فورًا في التسجيل والدليل ومعلومات التسجيل." },
    ],
  },

  draw: {
    title: { en: "Live Draw", ur: "لائیو ڈرا", "ur-roman": "Live Draw", hi: "लाइव ड्रॉ", ar: "السحب المباشر" },
    route: "/draw",
    who: ["admin"],
    steps: [
      { en: "The pool is everyone on the waitlist. Winning the draw is what approves a seller and creates her stall.", ur: "پول = ویٹ لسٹ والی سب۔ ڈرا جیتنے پر ہی seller approve ہوتی ہے اور اسٹال بنتا ہے۔", "ur-roman": "Pool = waitlist wali sab. Draw jeetne par hi seller approve hoti hai aur stall banta hai.", hi: "पूल = वेटलिस्ट की सब। ड्रॉ जीतने पर ही seller approve होती है व स्टॉल बनता है।", ar: "المجموعة هي كل من في قائمة الانتظار. الفوز بالسحب هو ما يعتمد البائعة ويُنشئ كشكها." },
      { en: "Press Play for one pick at a time, or Non-Stop to run until the target is reached.", ur: "ایک ایک پک کے لیے Play، یا ہدف تک چلانے کے لیے Non-Stop۔", "ur-roman": "Ek ek pick ke liye Play, ya target tak chalane ke liye Non-Stop.", hi: "एक-एक पिक हेतु Play, या लक्ष्य तक Non-Stop।", ar: "اضغط تشغيل لسحبة واحدة، أو بلا توقف حتى بلوغ الهدف." },
      { en: "Go Live broadcasts the ceremony to every visitor on the watch page.", ur: "Go Live سے تقریب سب وزیٹرز کو دکھتی ہے۔", "ur-roman": "Go Live se ceremony sab visitors ko dikhti hai.", hi: "Go Live से समारोह सभी विज़िटर को दिखता है।", ar: "البث المباشر يعرض الحفل لكل الزوار." },
      { en: "View selected lists every winner — remove one with ✕ and she returns to the waitlist, freeing her stall number for a fresh pick.", ur: "View selected میں ہر فاتح — ✕ سے ہٹائیں تو وہ ویٹ لسٹ میں واپس اور اس کا نمبر نئے ڈرا کے لیے خالی۔", "ur-roman": "View selected mein har faateh — ✕ se hataayein to wo waitlist mein wapas aur uska number naye draw ke liye khali.", hi: "View selected में हर विजेता — ✕ से हटाएँ तो वह वेटलिस्ट में वापस और उसका नंबर नए ड्रॉ हेतु ख़ाली।", ar: "عرض المختارات يسرد كل فائزة — أزلها بـ ✕ لتعود لقائمة الانتظار ويتحرر رقم كشكها لسحبة جديدة." },
      { en: "When the target is met you can raise the total and keep drawing, or Finish & save to close the season's draw.", ur: "ہدف پورا ہونے پر کل تعداد بڑھا کر مزید ڈرا کریں، یا Finish & save سے ڈرا بند کریں۔", "ur-roman": "Target pura hone par kul tadaad barha kar mazeed draw karein, ya Finish & save se draw band karein.", hi: "लक्ष्य पूरा होने पर कुल बढ़ाकर और ड्रॉ करें, या Finish & save से ड्रॉ बंद करें।", ar: "عند بلوغ الهدف ارفع الإجمالي وواصل السحب، أو أنهِ واحفظ لإغلاق سحب الموسم." },
    ],
    tip: { en: "Reset undoes the WHOLE draw — every winner goes back to the waitlist and their stalls are deleted. To change just one, use ✕ in View selected instead. Countdown and sweep speed are set in Settings → Live draw pace.", ur: "Reset پورا ڈرا ختم کرتا ہے — سب فاتحین ویٹ لسٹ میں اور اسٹال حذف۔ صرف ایک بدلنی ہو تو View selected میں ✕ استعمال کریں۔ رفتار Settings → Live draw pace سے۔", "ur-roman": "Reset poora draw khatam karta hai — sab faateheen waitlist mein aur stalls delete. Sirf ek badalni ho to View selected mein ✕ use karein. Speed Settings → Live draw pace se.", hi: "Reset पूरा ड्रॉ हटाता है — सब विजेता वेटलिस्ट में व स्टॉल हटते हैं। केवल एक बदलनी हो तो View selected में ✕। गति Settings → Live draw pace से।", ar: "إعادة التعيين تلغي السحب كله — تعود كل الفائزات لقائمة الانتظار وتُحذف أكشاكهن. لتغيير واحدة فقط استخدم ✕ في عرض المختارات. السرعة من الإعدادات." },
  },

  signup: {
    title: { en: "Sign up", ur: "سائن اپ", "ur-roman": "Sign up", hi: "साइन अप", ar: "إنشاء حساب" },
    route: "/signup",
    who: ["all"],
    steps: [
      { en: "Open Menu → Sign up. Amcho Bazar is a women-only community bazaar, so one account belongs to one seller.", ur: "مینو → Sign up کھولیں۔ امچو بازار خواتین کی کمیونٹی ہے — ایک اکاؤنٹ ایک بیچنے والی کا۔", "ur-roman": "Menu → Sign up kholein. Amcho Bazar women-only community hai — ek account ek seller ka.", hi: "Menu → Sign up खोलें। अमचो बाज़ार महिला समुदाय है — एक खाता एक विक्रेता का।", ar: "افتحي القائمة ← إنشاء حساب. أمتشو بازار مجتمع نسائي — حساب واحد لكل بائعة." },
      { en: "Enter your email and a password you'll remember, plus your city.", ur: "ای میل، ایک یاد رہنے والا پاس ورڈ اور اپنا شہر درج کریں۔", "ur-roman": "Email, ek yaad rehne wala password, aur apna city daalein.", hi: "ईमेल, याद रहने वाला पासवर्ड और अपना शहर डालें।", ar: "أدخلي بريدك وكلمة مرور تتذكّرينها، ومدينتك." },
      { en: "Tick the agreement box and tap Create account.", ur: "اتفاق کے خانے پر ٹک کریں اور Create account دبائیں۔", "ur-roman": "Agreement box par tick karein aur Create account dabayein.", hi: "सहमति बॉक्स पर टिक करें और Create account दबाएँ।", ar: "علّمي مربع الموافقة واضغطي إنشاء حساب." },
      { en: "You're signed in straight away — go to Register to add your stall.", ur: "فوراً سائن اِن ہو جائیں گی — اسٹال کے لیے Register پر جائیں۔", "ur-roman": "Foran sign in ho jayengi — stall ke liye Register par jayein.", hi: "तुरंत साइन इन हो जाएँगी — स्टॉल हेतु Register पर जाएँ।", ar: "يتم تسجيل دخولك فورًا — انتقلي إلى التسجيل لإضافة كشكك." },
    ],
    tip: { en: "Already registered before? Use Log in instead. Your name, phone and city are remembered and pre-fill the registration form, so you only type them once.", ur: "پہلے سے اکاؤنٹ ہے تو Log in کریں۔ نام، فون اور شہر یاد رہتے ہیں اور رجسٹریشن فارم میں خود بھر جاتے ہیں۔", "ur-roman": "Pehle se account hai to Log in karein. Naam, phone aur city yaad rehte hain aur registration form mein khud bhar jate hain.", hi: "पहले से खाता है? Log in करें। नाम, फ़ोन और शहर याद रहते हैं और फ़ॉर्म में स्वतः भर जाते हैं।", ar: "لديك حساب؟ سجّلي الدخول. يُحفظ اسمك وهاتفك ومدينتك وتُملأ تلقائيًا في نموذج التسجيل." },
  },

  register: {
    title: { en: "Registration", ur: "رجسٹریشن", "ur-roman": "Registration", hi: "पंजीकरण", ar: "التسجيل" },
    route: "/register",
    who: ["seller"],
    steps: [
      { en: "Registration only opens while the active season's status is 'Registration Open' — otherwise you'll see a closed/coming-soon notice.", ur: "رجسٹریشن صرف تب کھلتی ہے جب سیزن کا اسٹیٹس 'Registration Open' ہو — ورنہ بند/جلد آ رہا ہے کا پیغام۔", "ur-roman": "Registration sirf tab khulti hai jab season status 'Registration Open' ho — warna closed/coming-soon notice.", hi: "पंजीकरण केवल तब खुलता है जब सीज़न की स्थिति 'Registration Open' हो — अन्यथा बंद/जल्द आ रहा संदेश।", ar: "يفتح التسجيل فقط عندما تكون حالة الموسم 'فتح التسجيل' — وإلا سترين إشعار الإغلاق." },
      { en: "Step 1 — Personal: first name, surname, phone (WhatsApp), email and city. Phone is checked for a valid format.", ur: "مرحلہ ۱ — ذاتی: نام، سرنیم، فون (واٹس ایپ)، ای میل، شہر۔ فون کا فارمیٹ چیک ہوتا ہے۔", "ur-roman": "Step 1 — Personal: naam, surname, phone (WhatsApp), email, city. Phone ka format check hota hai.", hi: "चरण 1 — व्यक्तिगत: नाम, सरनेम, फ़ोन (WhatsApp), ईमेल, शहर। फ़ोन प्रारूप जाँचा जाता है।", ar: "الخطوة ١ — شخصي: الاسم، اللقب، الهاتف (واتساب)، البريد، المدينة. يُتحقق من صيغة الهاتف." },
      { en: "Step 2 — Business: business name, tagline, years running, Instagram, an optional logo, and 'what will you sell' (separate items with commas).", ur: "مرحلہ ۲ — کاروبار: نام، ٹیگ لائن، کتنے سال، انسٹاگرام، لوگو (اختیاری)، اور کیا بیچیں گی (کوما سے الگ)۔", "ur-roman": "Step 2 — Business: naam, tagline, kitne saal, Instagram, logo (optional), aur kya bechengi (comma se alag).", hi: "चरण 2 — व्यवसाय: नाम, टैगलाइन, कितने वर्ष, इंस्टाग्राम, लोगो (वैकल्पिक), और क्या बेचेंगी (कॉमा से अलग)।", ar: "الخطوة ٢ — النشاط: الاسم، الشعار النصي، السنوات، إنستغرام، شعار اختياري، وما ستبيعين (افصلي بفواصل)." },
      { en: "Any extra fields the admin added appear here too — required ones must be filled to continue.", ur: "ایڈمن کے شامل کردہ اضافی فیلڈ بھی یہیں آتے ہیں — لازمی والے بھرنا ضروری۔", "ur-roman": "Admin ke add kiye extra fields bhi yahin aate hain — required wale bharna zaroori.", hi: "एडमिन द्वारा जोड़े अतिरिक्त फ़ील्ड भी यहीं आते हैं — आवश्यक भरना ज़रूरी।", ar: "تظهر هنا أي حقول إضافية أضافها المشرف — يجب تعبئة الإلزامية للمتابعة." },
      { en: "Step 3 — Categories: pick one or more categories; if a category has sub-categories, choosing one is required.", ur: "مرحلہ ۳ — زمرے: ایک یا زیادہ زمرے چنیں؛ سب زمرے ہوں تو ایک چننا لازمی۔", "ur-roman": "Step 3 — Categories: ek ya zyada categories chunein; sub-categories hon to ek chunna lazmi.", hi: "चरण 3 — श्रेणियाँ: एक या अधिक चुनें; उप-श्रेणियाँ हों तो एक चुनना आवश्यक।", ar: "الخطوة ٣ — الفئات: اختاري فئة أو أكثر؛ وإن وُجدت فئات فرعية فاختيار واحدة إلزامي." },
      { en: "Step 4 — Review: check every row, tick Terms & Conditions (required — tap the link to read them), then Submit registration.", ur: "مرحلہ ۴ — جائزہ: ہر سطر دیکھیں، شرائط پر ٹک (لازمی — لنک سے پڑھیں)، پھر Submit۔", "ur-roman": "Step 4 — Review: har row dekhein, Terms & Conditions tick (lazmi — link se parhein), phir Submit.", hi: "चरण 4 — समीक्षा: हर पंक्ति देखें, नियम व शर्तें टिक (आवश्यक — लिंक से पढ़ें), फिर Submit।", ar: "الخطوة ٤ — المراجعة: راجعي كل سطر، ووافقي على الشروط (إلزامي — اضغطي الرابط لقراءتها)، ثم أرسلي." },
    ],
    tip: { en: "After submitting, your status is Waitlist — nobody is approved by hand. Sellers are approved only by winning the Live Draw, which also creates their stall in the directory. An unfinished form is saved as a draft, so a refresh won't lose your work.", ur: "Submit کے بعد اسٹیٹس Waitlist رہتا ہے — ہاتھ سے کوئی approve نہیں ہوتی۔ صرف Live Draw جیتنے پر approve اور اسٹال بنتا ہے۔ ادھورا فارم draft میں محفوظ رہتا ہے۔", "ur-roman": "Submit ke baad status Waitlist rehta hai — haath se koi approve nahi hoti. Sirf Live Draw jeetne par approve aur stall banta hai. Adhoora form draft mein mehfooz.", hi: "Submit के बाद स्थिति Waitlist रहती है — हाथ से कोई approve नहीं होती। केवल Live Draw जीतने पर approve व स्टॉल बनता है। अधूरा फ़ॉर्म ड्राफ़्ट में सुरक्षित।", ar: "بعد الإرسال تبقى الحالة قائمة الانتظار — لا موافقة يدوية. تتم الموافقة فقط بالفوز في السحب المباشر، وعندها يُنشأ الكشك. النموذج غير المكتمل يُحفظ كمسودة." },
  },

  reginfo: {
    title: { en: "Registration Info", ur: "رجسٹریشن معلومات", "ur-roman": "Registration Info", hi: "पंजीकरण जानकारी", ar: "معلومات التسجيل" },
    route: "/registration-info",
    who: ["seller", "admin"],
    steps: [
      { en: "This screen shows two different things: sellers edit their own details, admins control the form's fields.", ur: "یہ اسکرین دو کام کرتی ہے: بیچنے والی اپنی تفصیل بدلتی ہے، ایڈمن فارم کے فیلڈ کنٹرول کرتا ہے۔", "ur-roman": "Ye screen do kaam karti hai: seller apni detail badalti hai, admin form ke fields control karta hai.", hi: "यह स्क्रीन दो काम करती है: विक्रेता अपना विवरण बदलती है, एडमिन फ़ॉर्म के फ़ील्ड नियंत्रित करता है।", ar: "تعرض هذه الشاشة أمرين: البائعة تعدّل بياناتها، والمشرف يتحكم بحقول النموذج." },
      { en: "Seller — your details load automatically into three tabs: Personal, Business and Categories.", ur: "بیچنے والی — آپ کی تفصیل خودبخود تین ٹیبز میں آتی ہے: Personal، Business، Categories۔", "ur-roman": "Seller — aap ki detail khudbakhud teen tabs mein aati hai: Personal, Business, Categories.", hi: "विक्रेता — विवरण स्वतः तीन टैब में आता है: Personal, Business, Categories।", ar: "البائعة — تُحمّل بياناتك تلقائيًا في ثلاثة تبويبات: شخصي، الأعمال، الفئات." },
      { en: "Seller — edit anything (including the logo and admin-added fields), then press Save changes; the update shows everywhere at once.", ur: "بیچنے والی — کچھ بھی بدلیں (لوگو اور اضافی فیلڈ سمیت)، پھر Save changes؛ ہر جگہ فوراً اپ ڈیٹ۔", "ur-roman": "Seller — kuch bhi badlein (logo aur extra fields samet), phir Save changes; har jagah foran update.", hi: "विक्रेता — कुछ भी बदलें (लोगो व अतिरिक्त फ़ील्ड सहित), फिर Save changes; हर जगह तुरंत अपडेट।", ar: "البائعة — عدّلي أي شيء (الشعار والحقول الإضافية)، ثم احفظي؛ يظهر التحديث في كل مكان فورًا." },
      { en: "Seller — Categories: tap to select or unselect. To create a brand-new category type, use the Categories screen; it then appears here automatically.", ur: "زمرے: ٹیپ کرکے منتخب/غیر منتخب کریں۔ نیا زمرہ بنانا ہو تو Categories اسکرین سے — یہاں خودبخود آ جائے گا۔", "ur-roman": "Categories: tap karke select/unselect karein. Naya category type banana ho to Categories screen se — yahan khudbakhud aa jayega.", hi: "श्रेणियाँ: टैप कर चुनें/हटाएँ। नई श्रेणी बनानी हो तो Categories स्क्रीन से — यहाँ स्वतः आ जाएगी।", ar: "الفئات: اضغطي للاختيار أو الإلغاء. لإنشاء نوع فئة جديد استخدمي شاشة الفئات؛ ستظهر هنا تلقائيًا." },
      { en: "Admin — Existing fields: rename any built-in field with the pencil (e.g. 'Phone' → 'Phone (WhatsApp)'). Leave it empty to restore the default. Groups collapse to keep the list short.", ur: "ایڈمن — Existing fields: پینسل سے کسی بھی بلٹ اِن فیلڈ کا نام بدلیں۔ خالی چھوڑیں تو ڈیفالٹ۔ گروپس collapse ہو جاتے ہیں۔", "ur-roman": "Admin — Existing fields: pencil se kisi bhi built-in field ka naam badlein. Khali chhorein to default. Groups collapse ho jate hain.", hi: "एडमिन — Existing fields: पेंसिल से किसी भी बिल्ट-इन फ़ील्ड का नाम बदलें। खाली छोड़ें तो डिफ़ॉल्ट। समूह collapse होते हैं।", ar: "المشرف — الحقول الحالية: أعد تسمية أي حقل مدمج بالقلم. اتركه فارغًا للافتراضي. تُطوى المجموعات لاختصار القائمة." },
      { en: "Admin — Registration fields: add your own fields (text, number, paragraph or dropdown), mark them required, reorder or delete. They show on the form and as columns in the CSV export.", ur: "ایڈمن — Registration fields: اپنے فیلڈ شامل کریں (text/number/paragraph/dropdown)، لازمی کریں یا حذف۔ فارم اور CSV دونوں میں آتے ہیں۔", "ur-roman": "Admin — Registration fields: apne fields add karein (text/number/paragraph/dropdown), required karein ya delete. Form aur CSV dono mein aate hain.", hi: "एडमिन — Registration fields: अपने फ़ील्ड जोड़ें (text/number/paragraph/dropdown), आवश्यक करें या हटाएँ। फ़ॉर्म व CSV दोनों में आते हैं।", ar: "المشرف — حقول التسجيل: أضف حقولك (نص/رقم/فقرة/قائمة)، اجعلها إلزامية أو احذفها. تظهر في النموذج وكأعمدة في تصدير CSV." },
      { en: "Admin — Terms & Conditions: write the text sellers must accept. Leave it empty and the popup simply says none have been added.", ur: "ایڈمن — Terms & Conditions: وہ متن لکھیں جو قبول کرنا ہوگا۔ خالی چھوڑیں تو پاپ اپ میں 'کوئی شرائط نہیں'۔", "ur-roman": "Admin — Terms & Conditions: wo text likhein jo accept karna hoga. Khali chhorein to popup mein 'koi terms nahi'.", hi: "एडमिन — Terms & Conditions: वह पाठ लिखें जिसे स्वीकारना होगा। खाली छोड़ें तो पॉपअप में 'कोई शर्तें नहीं'।", ar: "المشرف — الشروط والأحكام: اكتب النص الذي يجب قبوله. إن تركته فارغًا تعرض النافذة أنه لا شروط." },
    ],
    tip: { en: "Admins don't register themselves — for them this screen is purely the form builder. The Terms checkbox always appears for sellers and is always required.", ur: "ایڈمن خود رجسٹر نہیں کرتے — ان کے لیے یہ صرف فارم بلڈر ہے۔ شرائط کا خانہ ہمیشہ آتا ہے اور لازمی ہے۔", "ur-roman": "Admin khud register nahi karte — un ke liye ye sirf form builder hai. Terms ka checkbox hamesha aata hai aur lazmi hai.", hi: "एडमिन स्वयं पंजीकरण नहीं करते — उनके लिए यह केवल फ़ॉर्म बिल्डर है। शर्तों का चेकबॉक्स हमेशा आता है और आवश्यक है।", ar: "المشرفون لا يسجّلون أنفسهم — الشاشة لهم أداة بناء النموذج فقط. مربع الشروط يظهر دائمًا وإلزامي." },
  },

  admin: {
    title: { en: "Admin Dashboard", ur: "ایڈمن ڈیش بورڈ", "ur-roman": "Admin Dashboard", hi: "एडमिन डैशबोर्ड", ar: "لوحة المشرف" },
    route: "/admin",
    who: ["admin"],
    steps: [
      { en: "The dashboard always shows the season you have selected — switch seasons from the menu to see another one's data.", ur: "ڈیش بورڈ منتخب سیزن کا ڈیٹا دکھاتا ہے — مینو سے سیزن بدلیں۔", "ur-roman": "Dashboard selected season ka data dikhata hai — menu se season badlein.", hi: "डैशबोर्ड चयनित सीज़न का डेटा दिखाता है — मेन्यू से सीज़न बदलें।", ar: "تعرض اللوحة بيانات الموسم المحدد — بدّل الموسم من القائمة." },
      { en: "Metrics at the top: Total registrations, Approved (draw winners), Waitlist (waiting for the draw) and Paid.", ur: "اوپر میٹرکس: کل رجسٹریشن، Approved (ڈرا فاتحین)، Waitlist (ڈرا کی منتظر)، Paid۔", "ur-roman": "Upar metrics: Total registrations, Approved (draw winners), Waitlist (draw ki muntazir), Paid.", hi: "ऊपर मेट्रिक्स: कुल पंजीकरण, Approved (ड्रॉ विजेता), Waitlist (ड्रॉ की प्रतीक्षा), Paid।", ar: "المقاييس أعلى: إجمالي التسجيلات، المقبولات (فائزات السحب)، قائمة الانتظار، المدفوع." },
      { en: "Use the search box (name, business, phone or category) and the status chips to narrow the review table down.", ur: "سرچ (نام/کاروبار/فون/زمرہ) اور status chips سے فہرست چھوٹی کریں۔", "ur-roman": "Search (naam/business/phone/category) aur status chips se list chhoti karein.", hi: "खोज (नाम/व्यवसाय/फ़ोन/श्रेणी) और status chips से सूची छोटी करें।", ar: "استخدم البحث (الاسم/النشاط/الهاتف/الفئة) ورقائق الحالة لتضييق الجدول." },
      { en: "On any row press ⋮ to Approve, move to Waitlist, Edit the details, or Delete. Approving also creates that seller's stall; moving back to Waitlist removes it.", ur: "کسی بھی سطر پر ⋮ → Approve، Waitlist، Edit یا Delete۔ Approve پر اسٹال بنتا ہے؛ Waitlist پر واپس ہٹ جاتا ہے۔", "ur-roman": "Kisi bhi row par ⋮ → Approve, Waitlist, Edit ya Delete. Approve par stall banta hai; Waitlist par wapas hat jata hai.", hi: "किसी भी पंक्ति पर ⋮ → Approve, Waitlist, Edit या Delete। Approve पर स्टॉल बनता है; Waitlist पर हट जाता है।", ar: "على أي صف اضغط ⋮ للموافقة أو النقل لقائمة الانتظار أو التعديل أو الحذف. الموافقة تُنشئ الكشك، والإرجاع للانتظار يزيله." },
      { en: "Tick several rows to act on them together — bulk Waitlist or bulk Delete.", ur: "کئی سطریں ٹک کرکے ایک ساتھ Waitlist یا Delete کریں۔", "ur-roman": "Kai rows tick karke ek saath Waitlist ya Delete karein.", hi: "कई पंक्तियाँ टिक कर एक साथ Waitlist या Delete करें।", ar: "حدّد عدة صفوف لتنفيذ إجراء جماعي: انتظار أو حذف." },
      { en: "Export CSV downloads every seller of this season — all details plus a column for each custom field — ready for Excel.", ur: "Export CSV اس سیزن کی ہر seller کی پوری تفصیل + custom fields کے کالم — Excel کے لیے۔", "ur-roman": "Export CSV is season ki har seller ki poori detail + custom fields ke columns — Excel ke liye.", hi: "Export CSV इस सीज़न की हर seller का पूरा विवरण + custom fields के कॉलम — Excel हेतु।", ar: "تصدير CSV يُنزّل كل بائعات الموسم — كل التفاصيل مع عمود لكل حقل مخصص — جاهزة لإكسل." },
    ],
    tip: { en: "The table is live: anything the draw or another admin changes appears here without a refresh. Seed / Add test seller creates dummy sellers so you can rehearse the draw, and Clear dummy removes only those — real registrations are never touched.", ur: "ٹیبل لائیو ہے: ڈرا یا کسی اور ایڈمن کی تبدیلی بغیر ریفریش نظر آتی ہے۔ Seed/Add test seller سے ڈمی بنائیں (ڈرا کی مشق)، Clear dummy صرف وہی ہٹاتا ہے — اصل ڈیٹا محفوظ۔", "ur-roman": "Table live hai: draw ya kisi aur admin ki tabdeeli bina refresh nazar aati hai. Seed/Add test seller se dummy banayein (draw ki mashq), Clear dummy sirf wohi hatata hai — asli data mehfooz.", hi: "टेबल लाइव है: ड्रॉ या अन्य एडमिन के बदलाव बिना रिफ़्रेश दिखते हैं। Seed/Add test seller से डमी बनाएँ (ड्रॉ अभ्यास), Clear dummy केवल वही हटाता है — असली डेटा सुरक्षित।", ar: "الجدول حي: أي تغيير من السحب أو مشرف آخر يظهر دون تحديث. بذر/إضافة بائعة تجريبية لتجربة السحب، ومسح الوهمي يزيلها فقط — البيانات الحقيقية آمنة." },
  },

  seasons: {
    title: { en: "Seasons", ur: "سیزنز", "ur-roman": "Seasons", hi: "सीज़न", ar: "المواسم" },
    route: "/seasons",
    who: ["admin"],
    steps: [
      { en: "A season is one round of the bazaar. Everything — registrations, stalls, payments, the draw — belongs to a season.", ur: "سیزن بازار کا ایک راؤنڈ ہے۔ رجسٹریشن، اسٹال، ادائیگی، ڈرا — سب ایک سیزن کے تحت۔", "ur-roman": "Season bazaar ka ek round hai. Registrations, stalls, payments, draw — sab ek season ke tehat.", hi: "सीज़न बाज़ार का एक राउंड है। पंजीकरण, स्टॉल, भुगतान, ड्रॉ — सब एक सीज़न के अंतर्गत।", ar: "الموسم جولة واحدة للبازار. كل شيء — التسجيلات، الأكشاك، المدفوعات، السحب — تابع لموسم." },
      { en: "Create season: name, number, year, banner image and description.", ur: "سیزن بنائیں: نام، نمبر، سال، بینر، تفصیل۔", "ur-roman": "Season banayein: naam, number, year, banner, description.", hi: "सीज़न बनाएँ: नाम, नंबर, वर्ष, बैनर, विवरण।", ar: "أنشئ موسمًا: الاسم، الرقم، السنة، اللافتة، الوصف." },
      { en: "Set the dates — registration opens and closes, plus the event date — and the venue and city.", ur: "تاریخیں مقرر کریں — رجسٹریشن کھلنے/بند اور ایونٹ کی تاریخ — اور مقام و شہر۔", "ur-roman": "Tareekhein muqarrar karein — registration open/close aur event date — aur venue & city.", hi: "तिथियाँ तय करें — पंजीकरण खुलना/बंद व आयोजन तिथि — तथा स्थान व शहर।", ar: "حدّد التواريخ — فتح وإغلاق التسجيل وتاريخ الحدث — والمكان والمدينة." },
      { en: "Maximum winners is the live draw's target (how many stalls get picked). Registration fee drives the Payments totals. Guidelines show to visitors.", ur: "Maximum winners = ڈرا کا ہدف (کتنے اسٹال چنے جائیں)۔ فیس سے Payments کے مجموعے بنتے ہیں۔ Guidelines سب کو نظر آتی ہیں۔", "ur-roman": "Maximum winners = draw ka target (kitne stalls chune jayein). Fee se Payments ke totals bante hain. Guidelines sab ko nazar aati hain.", hi: "Maximum winners = ड्रॉ का लक्ष्य (कितने स्टॉल चुने जाएँ)। शुल्क से Payments के योग बनते हैं। Guidelines सबको दिखती हैं।", ar: "أقصى عدد فائزات = هدف السحب (كم كشكًا يُختار). الرسوم تحدد إجماليات المدفوعات. الإرشادات تظهر للزوار." },
      { en: "Mark one season Active — the whole app (home, registration, draw, dashboard) follows the active season.", ur: "ایک سیزن کو Active کریں — پوری ایپ (ہوم، رجسٹریشن، ڈرا، ڈیش بورڈ) اسی پر چلتی ہے۔", "ur-roman": "Ek season ko Active karein — poori app (home, registration, draw, dashboard) usi par chalti hai.", hi: "एक सीज़न Active करें — पूरी ऐप (होम, पंजीकरण, ड्रॉ, डैशबोर्ड) उसी पर चलती है।", ar: "فعّل موسمًا واحدًا — يتبعه التطبيق كله (الرئيسية، التسجيل، السحب، اللوحة)." },
      { en: "Move the status along as the round progresses; it gates what people can do.", ur: "راؤنڈ آگے بڑھنے پر اسٹیٹس بدلتے جائیں؛ اسی سے سب کنٹرول ہوتا ہے۔", "ur-roman": "Round aage barhne par status badalte jayein; isi se sab control hota hai.", hi: "राउंड आगे बढ़ने पर स्थिति बदलते जाएँ; इसी से सब नियंत्रित होता है।", ar: "غيّر الحالة مع تقدم الجولة؛ فهي تتحكم بما يمكن للناس فعله." },
    ],
    tip: { en: "Status flow: Upcoming → Registration Open → Registration Closed → Draw Pending → Draw Running → Completed → Archived. Sellers can only register on 'Registration Open'; the draw only runs on 'Draw Pending/Running'; 'Completed' hides the live draw screen behind a summary (an admin can reopen it).", ur: "اسٹیٹس: Upcoming → Registration Open → Closed → Draw Pending → Draw Running → Completed → Archived۔ رجسٹریشن صرف 'Registration Open' پر؛ ڈرا صرف Draw Pending/Running پر؛ 'Completed' پر ڈرا اسکرین چھپ جاتی ہے (ایڈمن دوبارہ کھول سکتا ہے)۔", "ur-roman": "Status: Upcoming → Registration Open → Closed → Draw Pending → Draw Running → Completed → Archived. Registration sirf 'Registration Open' par; draw sirf Draw Pending/Running par; 'Completed' par draw screen chhup jati hai (admin dobara khol sakta hai).", hi: "स्थिति: Upcoming → Registration Open → Closed → Draw Pending → Draw Running → Completed → Archived। पंजीकरण केवल 'Registration Open' पर; ड्रॉ केवल Draw Pending/Running पर; 'Completed' पर ड्रॉ स्क्रीन छिप जाती है (एडमिन फिर खोल सकता है)।", ar: "الحالة: قادم → فتح التسجيل → إغلاق → بانتظار السحب → السحب جارٍ → مكتمل → مؤرشف. التسجيل فقط عند الفتح؛ السحب فقط عند بانتظار/جارٍ؛ و'مكتمل' يخفي شاشة السحب خلف ملخص (يمكن للمشرف إعادة فتحها)." },
  },

  payments: {
    title: { en: "Payments", ur: "ادائیگیاں", "ur-roman": "Payments", hi: "भुगतान", ar: "المدفوعات" },
    route: "/payments",
    who: ["admin"],
    steps: [
      { en: "Totals at the top: Expected (what should come in), Collected (what has come in) and Outstanding (still due).", ur: "اوپر مجموعے: Expected (آنا چاہیے)، Collected (آ گیا)، Outstanding (باقی)۔", "ur-roman": "Upar totals: Expected (aana chahiye), Collected (aa gaya), Outstanding (baaki).", hi: "ऊपर कुल: Expected (आना चाहिए), Collected (आ गया), Outstanding (शेष)।", ar: "الإجماليات: المتوقع، المُحصّل، والمتبقي." },
      { en: "Expected is based on the season's registration fee, so set the fee on the season first.", ur: "Expected سیزن کی فیس سے بنتا ہے — پہلے سیزن میں فیس مقرر کریں۔", "ur-roman": "Expected season ki fee se banta hai — pehle season mein fee muqarrar karein.", hi: "Expected सीज़न की फ़ीस से बनता है — पहले सीज़न में फ़ीस तय करें।", ar: "المتوقع مبني على رسوم الموسم — حدّد الرسوم في الموسم أولًا." },
      { en: "The ledger lists each seller with her payment state.", ur: "لیجر میں ہر seller اور اس کی payment state۔", "ur-roman": "Ledger mein har seller aur uski payment state.", hi: "लेजर में प्रत्येक seller व उसकी भुगतान स्थिति।", ar: "يسرد السجل كل بائعة وحالة دفعها." },
      { en: "Mark a seller paid when the money arrives; delete an entry if it was recorded by mistake.", ur: "رقم آنے پر mark paid؛ غلطی سے درج entry کو delete کریں۔", "ur-roman": "Raqam aane par mark paid; ghalti se darj entry ko delete karein.", hi: "पैसे आने पर mark paid; ग़लती से दर्ज entry delete करें।", ar: "علّم البائعة مدفوعة عند وصول المبلغ؛ واحذف الإدخال إن سُجّل بالخطأ." },
    ],
    tip: { en: "Paid sellers also show as Paid in the Admin Dashboard metrics, so both screens always agree.", ur: "Paid sellers ایڈمن ڈیش بورڈ کے Paid میٹرک میں بھی گنی جاتی ہیں — دونوں اسکرین ہم آہنگ۔", "ur-roman": "Paid sellers Admin Dashboard ke Paid metric mein bhi ginī jati hain — dono screens ham-aahang.", hi: "Paid sellers एडमिन डैशबोर्ड के Paid मेट्रिक में भी गिनी जाती हैं — दोनों स्क्रीन समान।", ar: "تظهر البائعات المدفوعات أيضًا ضمن مقياس المدفوع في لوحة المشرف، فتتطابق الشاشتان." },
  },

  announcements: {
    title: { en: "Announcements", ur: "اعلانات", "ur-roman": "Announcements", hi: "घोषणाएँ", ar: "الإعلانات" },
    route: "/announcements",
    who: ["admin", "all"],
    steps: [
      { en: "Write an update — a message plus an optional image (handy for posters or maps).", ur: "اپ ڈیٹ لکھیں — پیغام اور (اختیاری) تصویر (پوسٹر/نقشے کے لیے مفید)۔", "ur-roman": "Update likhein — message aur (optional) image (poster/naqshe ke liye mufeed).", hi: "अपडेट लिखें — संदेश और (वैकल्पिक) छवि (पोस्टर/नक्शे हेतु उपयोगी)।", ar: "اكتب تحديثًا — رسالة مع صورة اختيارية (مفيدة للملصقات أو الخرائط)." },
      { en: "Publish it — every visitor sees it on the Announcements page straight away.", ur: "شائع کریں — ہر visitor کو فوراً نظر آتا ہے۔", "ur-roman": "Publish karein — har visitor ko foran nazar aata hai.", hi: "प्रकाशित करें — हर विज़िटर को तुरंत दिखता है।", ar: "انشره — يراه كل زائر فورًا في صفحة الإعلانات." },
      { en: "Edit it later to correct something, or delete it once it's no longer relevant.", ur: "بعد میں Edit کریں یا غیر متعلق ہونے پر Delete۔", "ur-roman": "Baad mein Edit karein ya ghair-mutalliq hone par Delete.", hi: "बाद में Edit करें या अप्रासंगिक होने पर Delete।", ar: "عدّله لاحقًا أو احذفه عندما لا يعود مناسبًا." },
    ],
    tip: { en: "Use this for date changes, stall instructions or reminders — it's the fastest way to reach everyone at once.", ur: "تاریخ کی تبدیلی، اسٹال ہدایات یا یاد دہانی کے لیے — سب تک پہنچنے کا تیز ترین طریقہ۔", "ur-roman": "Date change, stall hidayaat ya reminder ke liye — sab tak pohanchne ka tez tareen tareeqa.", hi: "तिथि परिवर्तन, स्टॉल निर्देश या रिमाइंडर हेतु — सबको एक साथ पहुँचने का तेज़ तरीका।", ar: "استخدمه لتغييرات التواريخ أو تعليمات الأكشاك أو التذكيرات — أسرع وسيلة للوصول للجميع." },
  },

  reports: {
    title: { en: "Reports", ur: "رپورٹس", "ur-roman": "Reports", hi: "रिपोर्ट", ar: "التقارير" },
    route: "/reports",
    who: ["admin"],
    steps: [
      { en: "A place for season numbers and insights — this section is still being built.", ur: "سیزن کے numbers/insights کی جگہ — یہ سیکشن ابھی بن رہا ہے۔", "ur-roman": "Season ke numbers/insights ki jagah — ye section abhi ban raha hai.", hi: "सीज़न के आँकड़े/इनसाइट्स की जगह — यह अनुभाग अभी बन रहा है।", ar: "مكان لأرقام ورؤى الموسم — هذا القسم قيد الإنشاء." },
    ],
    tip: { en: "Meanwhile you already have the numbers: the Admin Dashboard metrics for a quick view, and Export CSV for the full data in Excel.", ur: "فی الحال: فوری نظر کے لیے ڈیش بورڈ میٹرکس، اور پورے ڈیٹا کے لیے Export CSV۔", "ur-roman": "Filhaal: foran nazar ke liye Dashboard metrics, aur poore data ke liye Export CSV.", hi: "फ़िलहाल: त्वरित दृष्टि हेतु डैशबोर्ड मेट्रिक्स, और पूरे डेटा हेतु Export CSV।", ar: "حاليًا لديك الأرقام: مقاييس اللوحة لنظرة سريعة، وتصدير CSV للبيانات الكاملة." },
  },

  settings: {
    title: { en: "Settings", ur: "ترتیبات", "ur-roman": "Settings", hi: "सेटिंग्स", ar: "الإعدادات" },
    route: "/settings",
    who: ["all", "admin"],
    steps: [
      { en: "Pick a section on the left; it opens in the panel on the right. Everyone sees Account; admins also get the Admin controls group.", ur: "بائیں سے سیکشن چنیں، دائیں پینل میں کھلتا ہے۔ سب کو Account؛ ایڈمن کو Admin controls بھی۔", "ur-roman": "Baayein se section chunein, daayein panel mein khulta hai. Sab ko Account; admin ko Admin controls bhi.", hi: "बाएँ से अनुभाग चुनें, दाएँ पैनल में खुलता है। सबको Account; एडमिन को Admin controls भी।", ar: "اختر قسمًا من اليسار ليُفتح في اللوحة اليمنى. الجميع يرى الحساب؛ والمشرف يرى أدوات المشرف أيضًا." },
      { en: "Account & security: see your account and role, and change your password.", ur: "Account & security: اپنا اکاؤنٹ و رول دیکھیں، پاس ورڈ بدلیں۔", "ur-roman": "Account & security: apna account/role dekhein, password badlein.", hi: "Account & security: अपना खाता व भूमिका देखें, पासवर्ड बदलें।", ar: "الحساب والأمان: اعرض حسابك ودورك، وغيّر كلمة المرور." },
      { en: "Event location: venue name, full address, Google Maps directions link, and the event date & time — all of it updates the home page's location section.", ur: "Event location: مقام، پتہ، Google Maps لنک، اور تاریخ و وقت — سب ہوم پیج کی location سیکشن اپ ڈیٹ کرتے ہیں۔", "ur-roman": "Event location: venue, address, Google Maps link, aur date & time — sab home page ki location section update karte hain.", hi: "Event location: स्थान, पता, Google Maps लिंक, तथा तिथि व समय — सब होम पेज की location सेक्शन अपडेट करते हैं।", ar: "موقع الحدث: اسم المكان، العنوان، رابط اتجاهات خرائط جوجل، والتاريخ والوقت — كلها تحدّث قسم الموقع في الرئيسية." },
      { en: "Live draw pace: set the countdown seconds and the sweep speed to any value you like — there are no fixed presets, so make it slower or faster to suit the room.", ur: "Live draw pace: countdown سیکنڈ اور sweep speed کوئی بھی قدر — کوئی فکس preset نہیں، جتنا چاہیں دھیما یا تیز۔", "ur-roman": "Live draw pace: countdown seconds aur sweep speed koi bhi value — koi fixed preset nahi, jitna chahein dheema ya tez.", hi: "Live draw pace: countdown सेकंड व sweep speed कोई भी मान — कोई फ़िक्स प्रीसेट नहीं, जितना चाहें धीमा या तेज़।", ar: "إيقاع السحب: اضبط ثواني العد التنازلي وسرعة المسح بأي قيمة — لا إعدادات ثابتة، أبطأ أو أسرع كما يناسبك." },
      { en: "Also under live draw: non-stop mode, which winner details are revealed, and a Facebook Live link for the public watch page.", ur: "لائیو ڈرا میں مزید: non-stop موڈ، کون سی تفصیل ظاہر ہو، اور Facebook Live لنک۔", "ur-roman": "Live draw mein mazeed: non-stop mode, kaun si detail zahir ho, aur Facebook Live link.", hi: "लाइव ड्रॉ में और: non-stop मोड, कौन-सा विवरण दिखे, और Facebook Live लिंक।", ar: "وضمن السحب أيضًا: وضع بلا توقف، وأي تفاصيل تُكشف، ورابط فيسبوك لايف لصفحة المشاهدة." },
      { en: "Content: the home hero image, the FAQ list, footer contact details, and filling default sub-categories.", ur: "Content: ہوم کی hero تصویر، FAQ، فوٹر رابطہ، اور ڈیفالٹ سب زمرے بھرنا۔", "ur-roman": "Content: home ki hero image, FAQ, footer contact, aur default sub-categories bharna.", hi: "Content: होम की hero छवि, FAQ, फ़ुटर संपर्क, और डिफ़ॉल्ट उप-श्रेणियाँ भरना।", ar: "المحتوى: صورة البطل، الأسئلة الشائعة، بيانات تواصل التذييل، وتعبئة الفئات الفرعية الافتراضية." },
    ],
    tip: { en: "Registration fields and Terms & Conditions used to live here — they've moved to Registration Info (admin), which is now the single place to shape the sign-up form.", ur: "Registration fields اور Terms & Conditions پہلے یہاں تھے — اب Registration Info (ایڈمن) میں ہیں، فارم بنانے کی واحد جگہ۔", "ur-roman": "Registration fields aur Terms & Conditions pehle yahan the — ab Registration Info (admin) mein hain, form banane ki wahid jagah.", hi: "Registration fields और Terms & Conditions पहले यहाँ थे — अब Registration Info (एडमिन) में हैं, फ़ॉर्म बनाने की एकमात्र जगह।", ar: "كانت حقول التسجيل والشروط هنا — انتقلت إلى معلومات التسجيل (المشرف)، المكان الوحيد لتشكيل النموذج." },
  },
};
