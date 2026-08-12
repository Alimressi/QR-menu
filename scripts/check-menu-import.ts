import { parseMenuText, summarizeParse } from "@/lib/menu-import";

let failures = 0;

function check(name: string, condition: boolean, got?: unknown) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${got === undefined ? "" : `  got: ${JSON.stringify(got)}`}`);
  }
}

console.log("a menu as a restaurant actually sends it");
const typical = parseMenuText(`
SALADS

Caesar Salad — chicken, parmesan, romaine lettuce   14.00
Greek Salad · tomato, cucumber, feta, olives  12.50
TEN/11 Salad    16

SOUPS:
Tomato soup ................ 8.00
Mastava — beef, rice, vegetables  11,00

DESSERTS
Tiramisu  9.00
`);

check("three categories found", typical.categories.length === 3, typical.categories.map((c) => c.name));
check("category names kept", typical.categories.map((c) => c.name).join("|") === "SALADS|SOUPS|DESSERTS");
check("six dishes found", summarizeParse(typical).dishCount === 6);
check("em dash splits name from description", typical.categories[0].dishes[0].name === "Caesar Salad");
check(
  "description captured",
  typical.categories[0].dishes[0].description === "chicken, parmesan, romaine lettuce",
);
check("decimal price parsed", typical.categories[0].dishes[0].price === 14);
check("middle dot also splits", typical.categories[0].dishes[1].name === "Greek Salad");
check("price without decimals", typical.categories[0].dishes[2].price === 16);
check("dish name with a slash survives", typical.categories[0].dishes[2].name === "TEN/11 Salad");
check("colon heading recognised, colon stripped", typical.categories[1].name === "SOUPS");
check("dot leaders removed from the name", typical.categories[1].dishes[0].name === "Tomato soup");
check("comma decimal separator", typical.categories[1].dishes[1].price === 11);

console.log("\ncurrency symbols and formats");
const currencies = parseMenuText(`
DRINKS
Espresso 3.50 ₼
Latte $4.00
Tea 2 AZN
Juice ₼5
Wine 12.00 manat
`);
check("all five priced lines parsed", currencies.categories[0]?.dishes.length === 5, currencies.categories[0]?.dishes);
check("trailing ₼ stripped", currencies.categories[0]?.dishes[0].price === 3.5);
check("leading $ stripped", currencies.categories[0]?.dishes[1].price === 4);
check("AZN suffix stripped", currencies.categories[0]?.dishes[2].price === 2);
check("leading ₼ stripped", currencies.categories[0]?.dishes[3].price === 5);
check("word 'manat' stripped", currencies.categories[0]?.dishes[4].price === 12);
check("no currency leaked into a name", currencies.categories[0]?.dishes[0].name === "Espresso");

console.log("\nmessy input");
const messy = parseMenuText(`
Joe's Diner
123 Main Street, Austin TX

BURGERS
Classic Burger  11.00

We source everything locally and cook it fresh every morning.

Bacon Burger  13.00
`);
check("address/heading with no dishes is dropped", !messy.categories.some((c) => c.name.includes("123 Main")));
check("both burgers kept under one category", messy.categories[0]?.dishes.length === 2, messy.categories);
check("prose sentence did not become a category", messy.categories.length === 1, messy.categories.map((c) => c.name));
check("prose sentence reported as skipped", messy.skipped.some((l) => l.startsWith("We source")));

console.log("\nedge cases");
const noHeading = parseMenuText("Pizza Margherita 15.00\nPizza Pepperoni 17.00");
check("dishes before any heading still land somewhere", noHeading.categories[0]?.dishes.length === 2);
check("fallback category is named", noHeading.categories[0]?.name === "Menu");

const empty = parseMenuText("");
check("empty input yields nothing, no crash", empty.categories.length === 0 && empty.skipped.length === 0);

const bareNumbers = parseMenuText("SALADS\n14.00\n12");
check("bare price lines are not dishes", bareNumbers.categories.length === 0, bareNumbers.categories);

const longDesc = parseMenuText("MAINS\nSteak — 300g dry-aged ribeye, served with roasted potatoes 45.00");
check("long description kept whole", longDesc.categories[0]?.dishes[0].description.includes("dry-aged ribeye"));
check("price still split off the description", longDesc.categories[0]?.dishes[0].price === 45);

const summary = summarizeParse(typical);
check("summary counts dishes", summary.dishCount === 6);
check("summary price range", summary.minPrice === 8 && summary.maxPrice === 16, [summary.minPrice, summary.maxPrice]);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
