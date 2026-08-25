import Link from "next/link";

// The service's own front door.
//
// This used to serve the lowest-numbered restaurant's menu, which meant the
// address printed on invoices opened somebody else's bar. Now it says what the
// service is, in the two languages Baku does business in.
//
// The Terms and Privacy links stay: "/" is the address Lemon Squeezy has on
// file, so it is where a reviewer lands, and a policy nothing links to is a
// policy a reviewer does not find.
//
// The language switch is two radios and a CSS rule — no JavaScript, so the page
// stays static and answers from the edge.

export const metadata = {
  title: "QR Menu - restoranlar üçün QR menyu",
  description:
    "Bir QR kod - qonaq menyunu öz telefonunda görür. Fotolarla, üç dildə, sifarişlə birlikdə.",
};

// wa.me wants the number bare — no plus, no spaces.
const WHATSAPP = "https://wa.me/994517770577";

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

function Panel({ lang }: { lang: keyof typeof COPY }) {
  const copy = COPY[lang];

  return (
    <>
      {/* Headline first, then the sentence. The sentence was the eyebrow once,
          set in wide-tracked capitals — three heavy lines on a phone, outweighing
          the title it was meant to introduce. An eyebrow has to be short; this
          one is a whole thought, so it reads as a lead instead. */}
      <h1
        className="fade-up font-serif text-[clamp(34px,7.5vw,64px)] leading-[1.06] text-gold-100"
        style={{ animationDelay: "60ms" }}
      >
        {copy.title}
      </h1>

      <p
        className="fade-up mt-5 max-w-lg text-[15px] leading-relaxed text-gold-100/50 sm:text-base"
        style={{ animationDelay: "140ms" }}
      >
        {copy.lead}
      </p>

      <dl className="mt-12 space-y-px sm:mt-14">
        {copy.points.map(([term, detail], index) => (
          <div
            key={term}
            className="fade-up border-t border-gold-500/15 py-5 sm:flex sm:gap-10 sm:py-6"
            style={{ animationDelay: `${220 + index * 70}ms` }}
          >
            <dt className="shrink-0 text-[17px] font-medium text-gold-100 sm:w-48">{term}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-gold-100/55 sm:mt-0">{detail}</dd>
          </div>
        ))}
      </dl>

      {/* The page described the product but never said who makes it or how to
          get one. A visitor has to be told, in one line, that this is on offer
          and that writing is the next step. */}
      <p className="fade-up mt-12 text-[15px] text-gold-100/70 sm:mt-14" style={{ animationDelay: "450ms" }}>
        {copy.invite}
      </p>

      {/* A pair, not a button with a stray line of text after it. On a phone the
          label is long enough to fill the row, which pushed the example link
          onto its own line as small underlined text — an afterthought hanging
          under the call to action. Both are full-width buttons there and sit
          side by side once there is room; the second is outlined rather than
          filled, so it reads as the quieter of the two. */}
      <div
        className="fade-up mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "520ms" }}
      >
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-transparent bg-gold-500 px-7 py-3.5 text-center text-sm font-medium text-[#120e08] transition hover:bg-gold-400"
        >
          {copy.contact}
        </a>
        <Link
          href="/lumiere"
          className="rounded-full border border-gold-500/25 px-7 py-3.5 text-center text-sm font-medium text-gold-100/70 transition hover:border-gold-500/50 hover:text-gold-100"
        >
          {copy.example}
        </Link>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 sm:py-16">
      {/* One soft pool of light, off to the side — the whole decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/3 rounded-full opacity-[0.16] blur-[110px]"
        style={{ background: "radial-gradient(circle, #b8944f 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-2xl lg:max-w-3xl">
        {/* The radios sit here, not outside the wrapper: `peer` styles a later
            SIBLING, so a panel one level deeper never sees the checked state. */}
        <input type="radio" name="lang" id="lang-az" defaultChecked className="peer/az sr-only" />
        <input type="radio" name="lang" id="lang-ru" className="peer/ru sr-only" />
        <input type="radio" name="lang" id="lang-en" className="peer/en sr-only" />

        <div className="fade-up mb-10 flex items-center justify-between sm:mb-12">
          <span className="font-serif text-lg text-gold-100">QR&nbsp;Menu</span>

          <div className="flex gap-1 text-[11px] uppercase tracking-[0.2em]">
            <label
              htmlFor="lang-az"
              className="cursor-pointer rounded-full px-3 py-1.5 text-gold-100/40 transition hover:text-gold-100/70 peer-checked/az:bg-gold-500/10 peer-checked/az:text-gold-100"
            >
              Az
            </label>
            <label
              htmlFor="lang-ru"
              className="cursor-pointer rounded-full px-3 py-1.5 text-gold-100/40 transition hover:text-gold-100/70 peer-checked/ru:bg-gold-500/10 peer-checked/ru:text-gold-100"
            >
              Ru
            </label>
            <label
              htmlFor="lang-en"
              className="cursor-pointer rounded-full px-3 py-1.5 text-gold-100/40 transition hover:text-gold-100/70 peer-checked/en:bg-gold-500/10 peer-checked/en:text-gold-100"
            >
              En
            </label>
          </div>
        </div>

        <div className="hidden peer-checked/az:block">
          <Panel lang="az" />
        </div>
        <div className="hidden peer-checked/ru:block">
          <Panel lang="ru" />
        </div>
        <div className="hidden peer-checked/en:block">
          <Panel lang="en" />
        </div>

        <footer
          className="fade-up mt-20 border-t border-gold-500/10 pt-6 text-xs text-gold-100/35"
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms" className="transition hover:text-gold-100/60">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition hover:text-gold-100/60">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
