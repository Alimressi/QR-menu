// Seeds the "Uzbechka" (Taste of Uzbekistan) restaurant from its printed PDF menu.
// Dark + gold theme, photoless (text) menu, AZ + RU (EN placeholders for later
// auto-translation). Run: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/seed-uzbechka.mjs
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SLUG = "uzbechka";
const ADMIN_LOGIN = "uzbechka";
const ADMIN_PASSWORD = "Uzbechka!2026"; // temporary — change in super-admin after launch

// ---- theme: warm dark + gold (logo is gold-on-black; menu is dark chocolate) ----
const settings = {
  serviceMode: "pro",
  photosEnabled: false,
  brandName: "Uzbechka",
  brandSubtitle: "Taste of Uzbekistan",
  infoNote: "Servis haqqı 10%",
  phone: "+994 70 793 50 74",
  instagramUrl: "https://www.instagram.com/uzbechka_baku/",
  address: "245 İnşaatçılar prospekti, Bakı, Azərbaycan",
  primaryColor: "#c8a24e",
  accentTextColor: "#1a1206",
  backgroundFrom: "#0b0906",
  backgroundTo: "#171009",
  surfaceColor: "rgba(28, 20, 12, 0.90)",
  textColor: "#f2e6cf",
  mutedTextColor: "#c9ac78",
  borderColor: "rgba(200, 162, 78, 0.35)",
  buttonRadius: "12px",
  cardRadius: "16px",
  tableCount: 12,
  panelColor: "#1a130c",
  overlayColor: "rgba(0, 0, 0, 0.6)",
  controlSurfaceColor: "#241a10",
  activeChipBackground: "#c8a24e",
  activeChipTextColor: "#1a1206",
  inactiveChipBackground: "#241a10",
  inactiveChipTextColor: "#f2e6cf",
  dividerColor: "rgba(200, 162, 78, 0.30)",
  successColor: "#4ade80",
  errorColor: "#f87171",
  categoryTitleColor: "#e8c987",
  qtyButtonBackground: "#241a10",
  qtyButtonTextColor: "#f2e6cf",
  qtyButtonBorderColor: "rgba(200, 162, 78, 0.35)",
  currencyMode: "manat",
  adminLogin: ADMIN_LOGIN,
};

// Helper: build a dish. az/ru are ingredient strings ("" if none). gr appended to descriptions.
const d = (nameAz, az, ru, price, gr, options) => ({
  nameAz,
  nameEn: nameAz, // placeholder until EN auto-translation
  nameRu: nameAz,
  descAz: [az, gr ? `${gr} gr` : ""].filter(Boolean).join(" · "),
  descRu: [ru, gr ? `${gr} г` : ""].filter(Boolean).join(" · "),
  price,
  options: options || [],
});

// Option helper (additive surcharge). label shown in all langs.
const o = (label, price) => ({ nameAz: label, nameEn: label, nameRu: label, price });

const menu = [
  {
    az: "Şorbalar", en: "Soups", ru: "Супы",
    dishes: [
      d("Şurpa", "Ət, kartof, kök, duz, istiot", "Говядина, картофель, морковь, соль, перец", 11, 250),
      d("Çuçvara şorbası", "Dana əti, xəmir, soğan, duz, istiot", "Говядина, тесто, лук, соль, перец", 10, 250),
      d("Mastava", "Dana əti, düyü, kök, noxud, soğan, kartof, duz, istiot", "Говядина, круглый рис, жёлтая и красная морковь, нут, лук, картофель, соль, перец", 11, 250),
    ],
  },
  {
    az: "Salatlar", en: "Salads", ru: "Салаты",
    dishes: [
      d("Çoban salatı", "Pomidor, xiyar, qırmızı soğan, göyərti, rəyhan, duz, istiot", "Помидор, огурец, красный лук, зелень, базилик, соль, перец", 6, 200),
      d("Açik çüçük", "Pomidor, soğan, acı bibər, duz", "Помидор, лук, острый перец, соль", 4, 200),
      d("Manqal salatı", "Badımcan, pomidor, acı bibər, soğan, duz, istiot", "Баклажан, помидор, острый перец, лук, соль, перец", 6, 200),
    ],
  },
  {
    az: "Soyuq qəlyanaltılar", en: "Cold appetizers", ru: "Холодные закуски",
    dishes: [
      d("Pendir assorti", "", "", 13, 250),
      d("Soya - Sparja", "", "", 4, 150),
      d("Kök salatı", "Kök, ədviyyatlar", "Морковь, специи", 4, 250),
    ],
  },
  {
    az: "Əsas yeməklər", en: "Main dishes", ru: "Основные блюда",
    dishes: [
      d("Özbək Plovu", "Düyü, mal əti, quyruq, soğan, kişmiş, kök, noxud, bildirçin yumurtası, zirə, duz, istiot", "Рис, говядина, курдючный жир, лук, изюм, морковь, нут, перепелиное яйцо, зира, соль, перец", 10, 0,
        [o("0.7 porsiya · 265 gr", 0), o("1 porsiya · 380 gr", 4)]),
      d("Alat samsa", "Xəmir, mal əti/toyuq, soğan, bibər, pomidor, duz, istiot", "Тесто, говядина/куриное филе, лук, болгарский перец, помидор, соль, перец", 2.5, 100,
        [o("Toyuq", 0), o("Ət", 1)]),
      d("Samsa", "Xəmir, mal əti/toyuq/kartof, soğan, duz, istiot", "Тесто, говядина/курица/картофель, лук, соль, перец", 2, 100,
        [o("Kartof", 0), o("Toyuq", 0.5), o("Ət", 1.5)]),
      d("Mantı", "Xəmir, dana əti, soğan, duz, istiot", "Тесто, говядина, лук, соль, перец", 13, 250),
      d("Xonum", "Xəmir, dana əti, kartof, soğan, duz, istiot", "Тесто, говядина, картофель, лук, соль, перец", 11, 250),
      d("Gülxanum", "Xəmir, dana əti, kartof, soğan, duz, istiot", "Тесто, говядина, картофель, лук, соль, перец", 11, 250),
      d("Çuçvara qızardılmış", "Xəmir, dana əti, soğan, duz, istiot", "Тесто, говядина, лук, соль, перец", 11, 150),
      d("Lağman", "Ev sayağı əriştə, dana əti, soğan, rəngli bibər, kərəviz, kök, pekin kələmi, duz, istiot", "Домашняя лапша, говядина, лук, разноцветный болгарский перец, сельдерей, морковь, пекинская капуста, соль, перец", 14, 250),
      d("Lağman qızardılmış", "Ev sayağı əriştə, dana əti, soğan, rəngli bibər, kərəviz, kök, pekin kələmi, duz, istiot", "Домашняя лапша, говядина, лук, разноцветный болгарский перец, сельдерей, морковь, пекинская капуста, соль, перец", 15, 250),
      d("Vaguri", "Quzu əti, duz, istiot, kartof fri", "Баранина, соль, перец, картофель фри", 24, 300),
      d("Kazan Kabab", "Kartof, mal əti, soğan, duz, istiot", "Картофель, говядина, лук, соль, перец", 21, 350),
    ],
  },
  {
    az: "Kabablar", en: "Kebabs", ru: "Кебабы",
    dishes: [
      d("Quzu basdırma (quyruq ilə)", "", "", 11, 150),
      d("Toyuq kababı", "", "", 7, 150),
      d("Lülə Kabab (dana əti)", "", "", 8, 150),
      d("Dana rulet", "", "", 11, 150),
      d("Dana basdırma (quyruq ilə)", "", "", 10, 150),
      d("Toyuq qanadları", "", "", 8, 150),
      d("Toyuq lülə", "", "", 7, 150),
      d("Napaleon kababı", "", "", 11, 150),
    ],
  },
  {
    az: "Qarnirlər", en: "Sides", ru: "Гарниры",
    dishes: [
      d("Düyü", "", "Рис", 5, 200),
      d("Kartof fri", "", "Картофель фри", 5, 200),
    ],
  },
  {
    az: "Desertlər", en: "Desserts", ru: "Десерты",
    dishes: [
      d("Halva Malina", "", "", 7.5, 250),
      d("Halva Badam", "", "", 7.5, 250),
      d("Halva Çiyələk", "", "", 7.5, 250),
      d("Halva Qozlu", "", "", 7.5, 250),
      d("Halva Püstəli", "", "", 8, 250),
      d("Halva Xanskaya (400 gr)", "", "", 10, 400),
      d("Halva Desretnaya", "", "", 10, 400),
      d("Halva Xanskaya (500 gr)", "", "", 13, 500),
      d("Halva Plombir", "", "", 13, 500),
      d("Halva Ruşan", "", "", 13, 500),
      d("Halva Hədiyyəlik (600 gr)", "", "", 25, 600),
      d("Halva Hədiyyəlik (1 kq)", "", "", 36.9, 1000),
    ],
  },
  {
    az: "Çay", en: "Tea", ru: "Чай",
    dishes: [
      d("Yaşıl çay", "", "Зелёный чай", 8, 0),
      d("Qara çay", "", "Чёрный чай", 8, 0),
      d("Çay barbaris", "", "", 8, 0),
      d("Çay şaftalı", "", "", 8, 0),
      d("Çay jasmin", "", "", 8, 0),
      d("Çay sitrus", "", "", 8, 0),
      d("Çay mango", "", "", 8, 0),
      d("Çay sakura", "", "", 8, 0),
      d("Çay 1001 gecə", "", "", 8, 0),
    ],
  },
  {
    az: "Limonadlar (Flavis)", en: "Lemonades", ru: "Лимонады",
    dishes: [
      d("Nar", "Qrafin", "Графин", 9, 0),
      d("Moxito Çiyelək", "Qrafin", "Графин", 9, 0),
      d("Moxito Laym", "Qrafin", "Графин", 9, 0),
      d("Çiyelək", "Qrafin", "Графин", 9, 0),
      d("Düşes", "Qrafin", "Графин", 9, 0),
      d("Moruğ", "Qrafin", "Графин", 9, 0),
    ],
  },
];

async function main() {
  const existing = await prisma.restaurant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Restaurant "${SLUG}" already exists (id ${existing.id}) — deleting for a clean re-seed…`);
    await prisma.restaurant.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Uzbechka",
      slug: SLUG,
      settings: JSON.stringify({ ...settings, adminPasswordHash: passwordHash }),
    },
  });
  console.log(`Created restaurant id ${restaurant.id}`);

  let dishCount = 0;
  let optionCount = 0;
  for (const cat of menu) {
    const category = await prisma.category.create({
      data: { nameEn: cat.en, nameRu: cat.ru, nameAz: cat.az, restaurantId: restaurant.id },
    });
    for (const dish of cat.dishes) {
      const created = await prisma.dish.create({
        data: {
          nameEn: dish.nameEn,
          nameRu: dish.nameRu,
          nameAz: dish.nameAz,
          descriptionEn: dish.descAz, // placeholder until EN auto-translation
          descriptionRu: dish.descRu,
          descriptionAz: dish.descAz,
          price: dish.price,
          imageUrl: "", // photoless menu
          categoryId: category.id,
          restaurantId: restaurant.id,
        },
      });
      dishCount++;
      for (const opt of dish.options) {
        await prisma.dishOption.create({
          data: { dishId: created.id, nameEn: opt.nameEn, nameRu: opt.nameRu, nameAz: opt.nameAz, price: opt.price },
        });
        optionCount++;
      }
    }
    console.log(`  ${cat.az}: ${cat.dishes.length} dishes`);
  }

  console.log(`\nDone: ${menu.length} categories, ${dishCount} dishes, ${optionCount} options.`);
  console.log(`Admin login: ${ADMIN_LOGIN} / ${ADMIN_PASSWORD}  (change it in super-admin!)`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
