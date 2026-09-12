import Image from "next/image";
import Link from "next/link";

// The service's own front door.
//
// This used to serve the lowest-numbered restaurant's menu, which meant the
// address printed on invoices opened somebody else's bar. Now it says what the
// service is, in the three languages Baku does business in.
//
// The Terms and Privacy links stay: "/" is the address Lemon Squeezy has on
// file, so it is where a reviewer lands, and a policy nothing links to is a
// policy a reviewer does not find.
//
// The language switch is three radios and a CSS rule — no JavaScript, so the
// page stays static and answers from the edge.
//
// Light, where the rest of the app is dark. The dark gold-on-black version read
// as a restaurant's own site rather than as the workshop that builds them, and
// a visitor could not tell in three seconds what was being sold. The body
// gradient in globals.css is overridden here the same way a guest menu
// overrides it — one rule in a style tag — so nothing else changes.

export const metadata = {
  title: "QR Menu - restoranlar üçün QR menyu",
  description:
    "Bir QR kod - qonaq menyunu öz telefonunda görür. Fotolarla, üç dildə, sifarişlə birlikdə.",
};

// wa.me wants the number bare — no plus, no spaces.
const WHATSAPP = "https://wa.me/994777171131";
const DEMO = "/lumiere";

// Real cards from a real menu, not an illustration of one. These three dishes
// are live at /lumiere right now, at these prices, with these photographs — the
// page is the product showing itself. The -card copies are the same 12-19 KB
// files the guest menu serves, so they cost nothing extra to put here.
const CARDS = [
  { name: "Burrata", price: 14, img: "/images/dishes/dish-308-card.jpg" },
  { name: "Avokado tost", price: 11, img: "/images/dishes/dish-303-card.jpg" },
  { name: "Sezar salatı", price: 12, img: "/images/dishes/dish-307-card.jpg" },
];

const COPY = {
  az: {
    lead: "Bir QR kod - və qonaq menyunu öz telefonunda görür. Restoranlar üçün belə menyular hazırlayıram.",
    title: "Restoranınız üçün QR menyu",
    points: [
      ["Üç dil", "Azərbaycan, rus və ingilis - qonaq özü seçir."],
      ["Masadan sifariş", "Qonaq masadan sifariş verir, mətbəx dərhal görür."],
      ["Dəyişiklik dərhal", "Qiymət dəyişdi - menyu yeniləndi. Yenidən çap yoxdur."],
    ],
    example: "Nümunəyə baxın",
    invite: "Öz yeriniz üçün belə menyu istəyirsiniz?",
    contact: "Mənimlə əlaqə saxlayın",
    scan: "Kameranı tutun",
  },
  en: {
    lead: "One QR code - and the guest sees the menu on their own phone. I build these menus for restaurants.",
    title: "A QR menu for your restaurant",
    points: [
      ["Three languages", "Azerbaijani, Russian and English - the guest picks."],
      ["Ordering at the table", "The guest orders from the table, the kitchen sees it at once."],
      ["Changes go live", "A price changed - the menu is updated. Nothing to reprint."],
    ],
    example: "See a live menu",
    invite: "Want one for your own place?",
    contact: "Get in touch with me",
    scan: "Point your camera",
  },
  ru: {
    lead: "Один QR-код - и гость видит меню на своём телефоне. Делаю такие меню для заведений.",
    title: "QR меню для вашего ресторана",
    points: [
      ["Три языка", "Азербайджанский, русский и английский - гость выбирает сам."],
      ["Заказ со стола", "Гость заказывает за столом, кухня видит сразу."],
      ["Правки мгновенно", "Изменилась цена - меню обновилось. Без перепечатки."],
    ],
    example: "Посмотреть пример",
    invite: "Хотите такое же для своего заведения?",
    contact: "Связаться со мной",
    scan: "Наведите камеру",
  },
} as const;

// Scoped to .lp so none of it reaches the guest menus, the admin or the super
// admin — all three paint themselves and share this stylesheet.
const CSS = `
.lp {
  --paper: #FBFBF9;
  --surface: #FFFFFF;
  --ink: #15130E;
  --muted: #6B675C;
  --line: #E7E4DB;
  --accent: #0E6B4A;
  --accent-soft: #E8F2ED;

  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
}

/* globals.css paints the body with a fixed dark gradient for the whole app.
   A guest menu overrides it per restaurant; this page does the same. */
body:has(.lp) { background: #FBFBF9; }

.lp-wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

/* ---------- header ---------- */

.lp-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 40px;
}

.lp-brand {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 9px;
}

/* The mark is the product: four modules of a QR code, drawn in CSS. */
.lp-mark {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background:
    linear-gradient(var(--ink), var(--ink)) 0 0 / 8px 8px no-repeat,
    linear-gradient(var(--ink), var(--ink)) 12px 0 / 8px 8px no-repeat,
    linear-gradient(var(--ink), var(--ink)) 0 12px / 8px 8px no-repeat,
    linear-gradient(var(--accent), var(--accent)) 12px 12px / 8px 8px no-repeat;
}

.lp-langs { display: flex; gap: 2px; }

.lp-langs label {
  cursor: pointer;
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--muted);
  transition: color 140ms ease, background-color 140ms ease;
}

.lp-langs label:hover { color: var(--ink); }

/* ---------- language switch ----------

   Was Tailwind's peer-checked variant, which only reaches a later SIBLING of
   the radio. The two-column layout puts each panel two levels down, so every
   panel stayed hidden and the page rendered with an empty left half. :has() on
   the wrapper reads the same checked state from any depth.

   Azerbaijani is shown by a plain rule and hidden by the :has() ones, so a
   browser too old for :has() still gets a readable page in the default
   language rather than a blank column — it just cannot switch. */

.lp-panel-ru, .lp-panel-en { display: none; }

.lp-wrap:has(#lang-ru:checked) .lp-panel-az,
.lp-wrap:has(#lang-en:checked) .lp-panel-az { display: none; }

.lp-wrap:has(#lang-ru:checked) .lp-panel-ru,
.lp-wrap:has(#lang-en:checked) .lp-panel-en { display: block; }

.lp-wrap:has(#lang-az:checked) label[for="lang-az"],
.lp-wrap:has(#lang-ru:checked) label[for="lang-ru"],
.lp-wrap:has(#lang-en:checked) label[for="lang-en"] {
  background: var(--accent-soft);
  color: var(--accent);
}

/* ---------- two columns ---------- */

.lp-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 56px;
  align-items: start;
}

@media (min-width: 900px) {
  .lp-wrap { padding: 36px 32px 88px; }
  .lp-cols { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: 72px; }
  .lp-top { padding-bottom: 64px; }
}

/* ---------- left column ---------- */

.lp h1 {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(38px, 6.4vw, 62px);
  line-height: 1.03;
  letter-spacing: -0.035em;
  margin: 0;
  text-wrap: balance;
}

.lp-lead {
  margin: 20px 0 0;
  max-width: 46ch;
  font-size: 17px;
  line-height: 1.6;
  color: var(--muted);
}

.lp-points {
  margin: 40px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.lp-point {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid var(--line);
}

/* Numbered because the three are a sequence a visitor walks through — pick a
   language, order, change a price — not three unrelated features. */
.lp-point-n {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  padding-top: 4px;
  font-variant-numeric: tabular-nums;
}

.lp-point dt {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
}

.lp-point dd {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--muted);
}

.lp-invite {
  margin: 40px 0 0;
  font-size: 17px;
  font-weight: 500;
}

.lp-cta {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 480px) {
  .lp-cta { flex-direction: row; align-items: center; }
}

.lp-btn {
  border-radius: 999px;
  padding: 14px 26px;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.lp-btn-solid {
  background: var(--accent);
  color: #FFFFFF;
  border: 1px solid var(--accent);
}

.lp-btn-solid:hover { background: #0B5A3D; }

.lp-btn-quiet {
  border: 1px solid var(--line);
  color: var(--ink);
  background: var(--surface);
}

.lp-btn-quiet:hover { border-color: #C9C4B6; }

.lp-btn:active { transform: scale(0.985); }

/* ---------- right column: the product, not a picture of it ---------- */

.lp-proof { display: flex; flex-direction: column; gap: 18px; }

.lp-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
}

.lp-card {
  display: grid;
  grid-template-columns: 68px 1fr auto;
  align-items: center;
  gap: 14px;
}

.lp-card img {
  width: 68px;
  height: 51px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.lp-card-name {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.lp-card-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.lp-cards-foot {
  border-top: 1px solid var(--line);
  padding-top: 11px;
  margin-top: 3px;
  font-size: 12.5px;
  color: var(--muted);
}

/* The QR is real: point a phone at the screen and the demo menu opens. */
.lp-qr {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px 18px;
}

.lp-qr svg { width: 78px; height: 78px; display: block; border-radius: 4px; }

.lp-qr-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.lp-qr-label {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
}

.lp-qr-url {
  font-size: 13px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

/* ---------- footer ---------- */

.lp-foot {
  margin-top: 72px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 13px;
  color: var(--muted);
}

.lp-foot a { color: var(--muted); text-decoration: none; }
.lp-foot a:hover { color: var(--ink); }

.lp a:focus-visible, .lp label:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* ---------- entrance ---------- */

.lp-rise {
  opacity: 0;
  animation: lp-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes lp-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}

/* The proof column arrives as one object rather than piece by piece — it is a
   single thing being handed over, and staggering its rows made it read as a
   list loading in. */
.lp-settle {
  opacity: 0;
  animation: lp-settle 760ms cubic-bezier(0.22, 1, 0.36, 1) 260ms forwards;
}

@keyframes lp-settle {
  from { opacity: 0; transform: translateY(20px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-rise, .lp-settle { opacity: 1; animation: none; }
}
`;

function Panel({ lang }: { lang: keyof typeof COPY }) {
  const copy = COPY[lang];

  return (
    <>
      <h1 className="lp-rise" style={{ animationDelay: "40ms" }}>
        {copy.title}
      </h1>

      <p className="lp-lead lp-rise" style={{ animationDelay: "110ms" }}>
        {copy.lead}
      </p>

      <dl className="lp-points">
        {copy.points.map(([term, detail], index) => (
          <div
            key={term}
            className="lp-point lp-rise"
            style={{ animationDelay: `${190 + index * 70}ms` }}
          >
            <span className="lp-point-n" aria-hidden>
              {index + 1}
            </span>
            <div>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="lp-invite lp-rise" style={{ animationDelay: "420ms" }}>
        {copy.invite}
      </p>

      <div className="lp-cta lp-rise" style={{ animationDelay: "480ms" }}>
        <a href={WHATSAPP} target="_blank" rel="noreferrer" className="lp-btn lp-btn-solid">
          {copy.contact}
        </a>
        <Link href={DEMO} className="lp-btn lp-btn-quiet">
          {copy.example}
        </Link>
      </div>
    </>
  );
}

// Generated once with `qrcode` and inlined rather than fetched or drawn at
// runtime: 1.2 KB of paths, no library, no request, and it renders before the
// first paint. Points at the demo menu — change the target and regenerate.
function DemoQr() {
  return (
    <svg viewBox="0 0 25 25" shapeRendering="crispEdges" role="img" aria-label="QR: qr-menu.az/lumiere">
      <path fill="#ffffff" d="M0 0h25v25H0z" />
      <path
        stroke="#15130E"
        d="M0 0.5h7m3 0h1m1 0h2m1 0h1m2 0h7M0 1.5h1m5 0h1m1 0h1m1 0h1m4 0h2m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m3 0h1m3 0h1m1 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m2 0h1m1 0h2m2 0h1m2 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m3 0h4m2 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m2 0h1m2 0h1m1 0h2m2 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 7.5h1m1 0h1m1 0h2m1 0h1M0 8.5h1m1 0h1m1 0h1m1 0h1m2 0h1m2 0h2m1 0h2m3 0h1m2 0h1M0 9.5h2m1 0h1m3 0h1m1 0h4m5 0h1m5 0h1M1 10.5h1m1 0h4m1 0h1m9 0h3m1 0h3M2 11.5h4m2 0h2m1 0h1m1 0h1m1 0h5m3 0h1M0 12.5h2m1 0h1m1 0h2m1 0h3m1 0h2m4 0h2m1 0h1m1 0h2M1 13.5h1m1 0h1m1 0h1m2 0h1m1 0h2m1 0h2m1 0h3m2 0h1m2 0h1M0 14.5h1m2 0h1m1 0h4m1 0h1m5 0h2m1 0h1m2 0h3M1 15.5h1m3 0h1m1 0h1m2 0h5m1 0h1m3 0h1m2 0h1M0 16.5h1m1 0h3m1 0h1m1 0h1m3 0h2m1 0h7M8 17.5h1m3 0h1m2 0h2m3 0h2m1 0h2M0 18.5h7m5 0h1m2 0h2m1 0h1m1 0h2m1 0h2M0 19.5h1m5 0h1m6 0h2m1 0h1m3 0h2m1 0h2M0 20.5h1m1 0h3m1 0h1m1 0h2m3 0h1m2 0h6M0 21.5h1m1 0h3m1 0h1m2 0h2m1 0h1m6 0h4M0 22.5h1m1 0h3m1 0h1m1 0h1m1 0h1m3 0h3m3 0h1m3 0h1M0 23.5h1m5 0h1m2 0h8m1 0h1m1 0h2m1 0h1M0 24.5h7m1 0h2m2 0h2m1 0h5m3 0h2"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <main className="lp">
        <div className="lp-wrap">
          {/* Read by the `:has()` rules above, so these can sit anywhere inside
              the wrapper — but keep them here, ahead of everything they drive. */}
          <input type="radio" name="lang" id="lang-az" defaultChecked className="sr-only" />
          <input type="radio" name="lang" id="lang-ru" className="sr-only" />
          <input type="radio" name="lang" id="lang-en" className="sr-only" />

          <header className="lp-top lp-rise">
            <span className="lp-brand">
              <span className="lp-mark" aria-hidden />
              QR&nbsp;Menu
            </span>

            <div className="lp-langs">
              <label htmlFor="lang-az">AZ</label>
              <label htmlFor="lang-ru">RU</label>
              <label htmlFor="lang-en">EN</label>
            </div>
          </header>

          <div className="lp-cols">
            <div>
              <div className="lp-panel-az">
                <Panel lang="az" />
              </div>
              <div className="lp-panel-ru">
                <Panel lang="ru" />
              </div>
              <div className="lp-panel-en">
                <Panel lang="en" />
              </div>
            </div>

            {/* Language-neutral on purpose: these are the dish names as a guest
                reads them at Lumière, and the QR needs no sentence to explain a
                web address. Nothing here has to be translated three times. */}
            <aside className="lp-proof lp-settle">
              <div className="lp-cards">
                {CARDS.map((card) => (
                  <div key={card.name} className="lp-card">
                    <Image src={card.img} alt="" width={68} height={51} />
                    <span className="lp-card-name">{card.name}</span>
                    <span className="lp-card-price">{card.price} ₼</span>
                  </div>
                ))}
                <div className="lp-cards-foot">Lumière · qr-menu.az/lumiere</div>
              </div>

              <Link href={DEMO} className="lp-qr">
                <DemoQr />
                <span className="lp-qr-text">
                  <span className="lp-qr-label">Lumière</span>
                  <span className="lp-qr-url">qr-menu.az/lumiere</span>
                </span>
              </Link>
            </aside>
          </div>

          <footer className="lp-foot lp-rise" style={{ animationDelay: "560ms" }}>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </footer>
        </div>
      </main>
    </>
  );
}
