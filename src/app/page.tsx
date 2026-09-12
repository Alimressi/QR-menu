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
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

@media (min-width: 900px) {
  .lp-wrap { padding: 40px 32px 96px; }
}

/* ---------- header ---------- */

.lp-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 48px;
}

@media (min-width: 900px) {
  .lp-top { padding-bottom: 72px; }
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
   the radio. Each panel sits a level down, so every panel stayed hidden and the
   page rendered with an empty column. :has() on the wrapper reads the same
   checked state from any depth.

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

/* ---------- the page ---------- */

.lp h1 {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(38px, 6.8vw, 60px);
  line-height: 1.03;
  letter-spacing: -0.035em;
  margin: 0;
  max-width: 14ch;
  text-wrap: balance;
}

.lp-lead {
  margin: 22px 0 0;
  max-width: 46ch;
  font-size: 17px;
  line-height: 1.6;
  color: var(--muted);
}

.lp-points {
  margin: 44px 0 0;
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
  max-width: 52ch;
}

.lp-invite {
  margin: 44px 0 0;
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

/* ---------- footer ---------- */

.lp-foot {
  margin-top: 80px;
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

@media (prefers-reduced-motion: reduce) {
  .lp-rise { opacity: 1; animation: none; }
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

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <main className="lp">
        <div className="lp-wrap">
          {/* Read by the :has() rules above, so these can sit anywhere inside
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

          <div className="lp-panel-az">
            <Panel lang="az" />
          </div>
          <div className="lp-panel-ru">
            <Panel lang="ru" />
          </div>
          <div className="lp-panel-en">
            <Panel lang="en" />
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
