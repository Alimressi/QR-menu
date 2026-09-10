// Fill the Russian and English name columns for a GamePoint menu, and let the
// names follow the guest's interface language.
//
// GamePoint asked for this by phone: a guest who switches the menu to Russian
// expects the food to be in Russian too. Every dish in both venues was created
// with the same Azerbaijani string in all three name columns, so the
// "follow the interface" setting had nothing to follow — flipping it alone
// changes nothing on screen. The translations have to exist first.
//
// Keyed by the Azerbaijani name rather than by dish id, because GamePoint and
// GamePoint Pro hold the same dishes under different ids, and this way the
// second venue is one command rather than a second table.
//
// Two names were checked against their photographs rather than trusted from the
// word: Araxis is peanuts and Fıstıq is pistachios. Both words can mean peanut
// in Azerbaijani, the menu lists them separately, and the prompt file that
// generated the pictures has them the other way round — it predates the day the
// two photos were swapped. The pictures a guest actually sees are the authority.
//
// Usage:
//   node scripts/translate-gamepoint-names.mjs gamepoint --dry
//   node scripts/translate-gamepoint-names.mjs gamepoint

import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";

const slug = process.argv[2];
const dryRun = process.argv.includes("--dry");

if (!slug) {
  console.error("Usage: node scripts/translate-gamepoint-names.mjs <slug> [--dry]");
  process.exit(1);
}

// Brand names stay in Latin in every language: that is how a Baku menu prints
// them and how a guest recognises the bottle in front of them. Only the
// describing half is translated — "Xirdalan Draft" becomes "Xirdalan разливное",
// not "Хырдалан разливное".
const NAMES = {
  // Qəlyanaltılar
  "İveria Sosisləri": ["Сосиски «Iveria»", "Iveria Sausages"],
  "Ət Basdırma": ["Бастурма", "Beef Basturma"],
  "Qızardılmış Gürza": ["Жареная гюрза", "Fried Gurza"],
  "Sacaqlı Pendir": ["Сыр косичка", "String Cheese"],
  "Düşbərə": ["Дюшбара", "Dushbara"],
  "Kənd Sayağı Kartof": ["Картофель по-деревенски", "Country-Style Potatoes"],
  "Cips": ["Чипсы", "Chips"],
  "Suxari": ["Сухарики", "Croutons"],
  "Fıstıq": ["Фисташки", "Pistachios"],
  "Nuggets": ["Наггетсы", "Nuggets"],
  "Fri Kartof": ["Картофель фри", "French Fries"],
  "Araxis": ["Арахис", "Peanuts"],
  "Popkorn": ["Попкорн", "Popcorn"],

  // Pizzalar
  "Qarışıq Pizza": ["Пицца «Ассорти»", "Mixed Pizza"],
  "Sucuklu Pizza": ["Пицца с сучуком", "Sujuk Pizza"],
  "Toyuqlu Pizza": ["Пицца с курицей", "Chicken Pizza"],
  "Marqarita Pizza": ["Пицца «Маргарита»", "Margherita Pizza"],

  // Kombolar
  "Cheese Burger + Fri + Cola 500 ml": [
    "Чизбургер + картофель фри + кола 500 мл",
    "Cheese Burger + Fries + Cola 500 ml",
  ],
  "Chicken Barbekü Burger + Fri + Cola 0.5 L": [
    "Бургер «Чикен барбекю» + картофель фри + кола 0.5 л",
    "Chicken Barbecue Burger + Fries + Cola 0.5 L",
  ],
  "Nuggets + Fri + Cola 0.5 L": ["Наггетсы + картофель фри + кола 0.5 л", "Nuggets + Fries + Cola 0.5 L"],
  "Saurma + Fri + Cola 500 ml": ["Шаурма + картофель фри + кола 500 мл", "Shawarma + Fries + Cola 500 ml"],
  "Nuggets Burger + Fri + Cola 500 ml": [
    "Бургер с наггетсами + картофель фри + кола 500 мл",
    "Nuggets Burger + Fries + Cola 500 ml",
  ],
  "Çay + Qəlyan + Şokolad": ["Чай + кальян + шоколад", "Tea + Hookah + Chocolate"],
  "Vetçinalı Sendviç + Fri + Cola 500 ml": [
    "Сэндвич с ветчиной + картофель фри + кола 500 мл",
    "Ham Sandwich + Fries + Cola 500 ml",
  ],
  "Chicken Roll + Fri + Cola 500 ml": [
    "Чикен-ролл + картофель фри + кола 500 мл",
    "Chicken Roll + Fries + Cola 500 ml",
  ],

  // Sendviç / Burger
  "Cheese Burger": ["Чизбургер", "Cheese Burger"],
  "Hotdog": ["Хот-дог", "Hot Dog"],
  "Saurma": ["Шаурма", "Shawarma"],
  "Chicken Roll": ["Чикен-ролл", "Chicken Roll"],
  "Chicken Barbekü Burger": ["Бургер «Чикен барбекю»", "Chicken Barbecue Burger"],
  "Nuggets Burger": ["Бургер с наггетсами", "Nuggets Burger"],
  "Vetçinalı Sendviç": ["Сэндвич с ветчиной", "Ham Sandwich"],
  "Sosisli Tost": ["Тост с сосиской", "Sausage Toast"],
  "Sosisli Pendirli Tost": ["Тост с сосиской и сыром", "Sausage & Cheese Toast"],

  // Qəlyanlar
  "Qəlyan Qreyfrutda": ["Кальян на грейпфруте", "Hookah on Grapefruit"],
  "Qəlyan Almada": ["Кальян на яблоке", "Hookah on Apple"],
  "Qəlyan Caskada": ["Кальян «Каскада»", "Caskada Hookah"],

  // Pivə
  "Blanc 1664": ["Blanc 1664", "Blanc 1664"],
  "Calsberg": ["Calsberg", "Calsberg"],
  "Xirdalan Draft": ["Xirdalan разливное", "Xirdalan Draft"],
  "Xirdalan 0": ["Xirdalan безалкогольное", "Xirdalan Non-Alcoholic"],
  "Xirdalan No Filter": ["Xirdalan нефильтрованное", "Xirdalan Unfiltered"],
  "Xirdalan Sadə": ["Xirdalan классическое", "Xirdalan Classic"],

  // Soyuq İçkilər
  "Hand Made Limonad": ["Домашний лимонад", "Homemade Lemonade"],
  "Sirab 500 ml": ["Sirab 500 мл", "Sirab 500 ml"],
  "Ayran": ["Айран", "Ayran"],
  "Bizon White Diamond": ["Bizon White Diamond", "Bizon White Diamond"],
  "Bizon Cyber": ["Bizon Cyber", "Bizon Cyber"],
  "Bizon": ["Bizon", "Bizon"],
  "Sirab Qazlı": ["Sirab газированная", "Sirab Sparkling"],
  "Red Bull": ["Red Bull", "Red Bull"],
  "Fuse Tea 1 L": ["Fuse Tea 1 л", "Fuse Tea 1 L"],
  "Fuse Tea Banka": ["Fuse Tea банка", "Fuse Tea Can"],
  "Cola / Fanta / Sprite 1 L": ["Cola / Fanta / Sprite 1 л", "Cola / Fanta / Sprite 1 L"],
  "Cola / Fanta / Sprite 500 ml": ["Cola / Fanta / Sprite 500 мл", "Cola / Fanta / Sprite 500 ml"],
  "Cola / Fanta / Sprite 300 ml": ["Cola / Fanta / Sprite 300 мл", "Cola / Fanta / Sprite 300 ml"],
  "Cola / Fanta / Sprite 330 ml": ["Cola / Fanta / Sprite 330 мл", "Cola / Fanta / Sprite 330 ml"],

  // İsti İçkilər. The two teas differ by how they arrive rather than by
  // strength — 278 is photographed as a pot, 279 as a single armudu glass — so
  // the translation says the vessel, which is the thing a guest is choosing
  // between. "Sadə" on its own would translate to "plain" and distinguish
  // nothing.
  "Kakao Marshmallow": ["Какао с маршмеллоу", "Cocoa with Marshmallow"],
  "İsti Şokolad": ["Горячий шоколад", "Hot Chocolate"],
  "Südlü Qəhvə": ["Кофе с молоком", "Coffee with Milk"],
  "Amerikano": ["Американо", "Americano"],
  "Çay Fincan": ["Чай (чашка)", "Tea (Cup)"],
  "Çay Sadə": ["Чай (чайник)", "Tea (Pot)"],

  // Mürəbbə
  "Plombir": ["Пломбир", "Plombir"],
  "Çiyələk": ["Клубника", "Strawberry"],
  "Ağ Gilas": ["Белая черешня", "White Cherry"],
  "Bounty": ["Bounty", "Bounty"],
  "Snickers": ["Snickers", "Snickers"],

  // Smoothie
  "Çiyələk və Qarağat": ["Клубника и смородина", "Strawberry & Currant"],
  "Giləmeyvəli": ["Ягодный", "Berry"],
  "Banana və Karamell": ["Банан и карамель", "Banana & Caramel"],
  "Milkshake": ["Милкшейк", "Milkshake"],

  // Şirniyyat
  "Kukers": ["Печенье", "Cookies"],
  "Dondurma": ["Мороженое", "Ice Cream"],
  "Qarışıq Ləbləbi": ["Лябляби ассорти", "Mixed Roasted Chickpeas"],
  "Profiterol": ["Профитроли", "Profiteroles"],
  "Ballı Tort": ["Медовый торт", "Honey Cake"],
  "Şokolad": ["Шоколад", "Chocolate"],

  // Setlər
  "Set 70 AZN": ["Сет 70 AZN", "Set 70 AZN"],
  "Set 48 AZN": ["Сет 48 AZN", "Set 48 AZN"],
  "Set 32 AZN": ["Сет 32 AZN", "Set 32 AZN"],

  // Spirtli İçkilər and VIP Setlər — GamePoint Pro only, listed so the same
  // command covers that venue when it is asked for.
  "Meysəri": ["Meysəri", "Meysəri"],
  "Jack Daniels 500 ml": ["Jack Daniel's 500 мл", "Jack Daniel's 500 ml"],
  "Tekilla Sierra 1 litr": ["Текила Sierra 1 л", "Sierra Tequila 1 L"],
  "Jagermeister 1 litr": ["Jägermeister 1 л", "Jägermeister 1 L"],
  "Jameson 1 litr": ["Jameson 1 л", "Jameson 1 L"],
  "Jack Daniel Seti 0.5": ["Сет Jack Daniel's 0.5", "Jack Daniel's Set 0.5"],
  "Şərab Seti": ["Винный сет", "Wine Set"],
  "Sierra Tekilla Seti": ["Сет «Текила Sierra»", "Sierra Tequila Set"],
  "Jagermeister Seti": ["Сет Jägermeister", "Jägermeister Set"],
  "Jameson Seti": ["Сет Jameson", "Jameson Set"],
};

// Set descriptions. Without these a Russian guest reads "Сет 70 AZN" above a
// line of Azerbaijani, which is the same complaint one line further down.
// The hours differ between the venues — GamePoint sells three, Pro two — so the
// Azerbaijani text is matched exactly rather than by set name.
const DESCRIPTIONS = {
  "Burger nuggets 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, cips 2 ədəd, çay, mürəbbə, qəlyan, 2 saat VIP kabinet":
    [
      "Бургер с наггетсами 4 шт., картофель фри 4 шт., Coca-Cola 0.3 л 4 шт., чипсы 2 шт., чай, варенье, кальян, 2 часа VIP-кабина",
      "Nuggets burger x4, french fries x4, Coca-Cola 0.3 L x4, chips x2, tea, jam, hookah, 2 hours in a VIP cabin",
    ],
  "Burger nuggets 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, cips 2 ədəd, çay, mürəbbə, qəlyan, 3 saat VIP kabinet":
    [
      "Бургер с наггетсами 4 шт., картофель фри 4 шт., Coca-Cola 0.3 л 4 шт., чипсы 2 шт., чай, варенье, кальян, 3 часа VIP-кабина",
      "Nuggets burger x4, french fries x4, Coca-Cola 0.3 L x4, chips x2, tea, jam, hookah, 3 hours in a VIP cabin",
    ],
  "Şaurma 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, çay, şokolad, 2 saat VIP kabinet": [
    "Шаурма 4 шт., картофель фри 4 шт., Coca-Cola 0.3 л 4 шт., чай, шоколад, 2 часа VIP-кабина",
    "Shawarma x4, french fries x4, Coca-Cola 0.3 L x4, tea, chocolate, 2 hours in a VIP cabin",
  ],
  "Şaurma 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, çay, şokolad, 3 saat VIP kabinet": [
    "Шаурма 4 шт., картофель фри 4 шт., Coca-Cola 0.3 л 4 шт., чай, шоколад, 3 часа VIP-кабина",
    "Shawarma x4, french fries x4, Coca-Cola 0.3 L x4, tea, chocolate, 3 hours in a VIP cabin",
  ],
  "Çay, şokolad, qəlyan, 2 saat VIP kabinet": [
    "Чай, шоколад, кальян, 2 часа VIP-кабина",
    "Tea, chocolate, hookah, 2 hours in a VIP cabin",
  ],
  "Çay, şokolad, qəlyan, 3 saat VIP kabinet": [
    "Чай, шоколад, кальян, 3 часа VIP-кабина",
    "Tea, chocolate, hookah, 3 hours in a VIP cabin",
  ],
  "Meyvə assorti, qəlyan saxsı, 2 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet": [
    "Фруктовое ассорти, кальян на чаше, Red Bull 2 шт., фруктовый сок 1 л, 3 часа VIP-кабина",
    "Fruit platter, clay-bowl hookah, Red Bull x2, fruit juice 1 L, 3 hours in a VIP cabin",
  ],
  "Meysəri, meyvə assorti, qəlyan saxsı, 3 saat VIP kabinet": [
    "Meysəri, фруктовое ассорти, кальян на чаше, 3 часа VIP-кабина",
    "Meysəri, fruit platter, clay-bowl hookah, 3 hours in a VIP cabin",
  ],
  "Sierra Tekilla 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet":
    [
      "Текила Sierra 1 л, фруктовое ассорти, кальян на чаше, Red Bull 4 шт., фруктовый сок 1 л, 3 часа VIP-кабина",
      "Sierra Tequila 1 L, fruit platter, clay-bowl hookah, Red Bull x4, fruit juice 1 L, 3 hours in a VIP cabin",
    ],
  "Jagermeister 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet":
    [
      "Jägermeister 1 л, фруктовое ассорти, кальян на чаше, Red Bull 4 шт., фруктовый сок 1 л, 3 часа VIP-кабина",
      "Jägermeister 1 L, fruit platter, clay-bowl hookah, Red Bull x4, fruit juice 1 L, 3 hours in a VIP cabin",
    ],
  "Jameson 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet": [
    "Jameson 1 л, фруктовое ассорти, кальян на чаше, Red Bull 4 шт., фруктовый сок 1 л, 3 часа VIP-кабина",
    "Jameson 1 L, fruit platter, clay-bowl hookah, Red Bull x4, fruit juice 1 L, 3 hours in a VIP cabin",
  ],
};

const env = await fs.readFile(".env", "utf8");
const sql = neon(env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^"|"$/g, ""));

const restaurant = (await sql`SELECT id, name, settings FROM "Restaurant" WHERE slug = ${slug}`)[0];

if (!restaurant) {
  console.error(`No restaurant "${slug}".`);
  process.exit(1);
}

const dishes = await sql`
  SELECT id, "nameAz", "descriptionAz" FROM "Dish" WHERE "restaurantId" = ${restaurant.id} ORDER BY id`;

// Nothing is written until every dish on the menu has a translation. A partial
// pass would leave a menu half in Azerbaijani with no sign of which half.
const missingNames = dishes.filter((dish) => !NAMES[dish.nameAz]);
const missingDescriptions = dishes.filter(
  (dish) => dish.descriptionAz && !DESCRIPTIONS[dish.descriptionAz],
);

if (missingNames.length > 0 || missingDescriptions.length > 0) {
  for (const dish of missingNames) console.error(`  no translation for name: ${dish.nameAz}`);
  for (const dish of missingDescriptions) {
    console.error(`  no translation for description of ${dish.nameAz}: ${dish.descriptionAz}`);
  }
  console.error(`\n${missingNames.length} names and ${missingDescriptions.length} descriptions missing. Nothing written.`);
  process.exit(1);
}

console.log(`${restaurant.name} (/${slug}): ${dishes.length} dishes, all translated.`);

if (dryRun) {
  for (const dish of dishes) {
    const [ru, en] = NAMES[dish.nameAz];
    console.log(`  ${dish.nameAz.padEnd(42)} | ${ru.padEnd(42)} | ${en}`);
  }
  console.log("\nDry run — nothing written.");
  process.exit(0);
}

for (const dish of dishes) {
  const [nameRu, nameEn] = NAMES[dish.nameAz];

  await sql`UPDATE "Dish" SET "nameRu" = ${nameRu}, "nameEn" = ${nameEn} WHERE id = ${dish.id}`;

  // Descriptions are a separate statement, and only for the dishes that have
  // one. Writing them in the same UPDATE meant naming the description columns
  // for every dish, which would have blanked them on the eighty-odd dishes that
  // carry no description at all.
  if (dish.descriptionAz) {
    const [descriptionRu, descriptionEn] = DESCRIPTIONS[dish.descriptionAz];

    await sql`
      UPDATE "Dish"
      SET "descriptionRu" = ${descriptionRu}, "descriptionEn" = ${descriptionEn}
      WHERE id = ${dish.id}`;
  }
}

// Only now is there anything for the setting to follow.
const settings = typeof restaurant.settings === "string" ? JSON.parse(restaurant.settings) : (restaurant.settings ?? {});
settings.dishNameLanguage = "auto";

await sql`UPDATE "Restaurant" SET settings = ${JSON.stringify(settings)} WHERE id = ${restaurant.id}`;

console.log(`Wrote ${dishes.length} dishes and set dishNameLanguage = "auto".`);
