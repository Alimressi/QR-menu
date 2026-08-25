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
  title: "QR Menu — rəqəmsal menyu restoranlar üçün",
  description:
    "Bir QR kod — qonaq menyunu öz telefonunda görür. Fotolarla, üç dildə, sifarişlə birlikdə.",
};

// wa.me wants the number bare — no plus, no spaces.
const WHATSAPP = "https://wa.me/994517770577";

const COPY = {
  az: {
    lead: "Bir QR kod — və qonaq menyunu öz telefonunda görür.",
    title: "Restoranınız üçün rəqəmsal menyu",
    points: [
      ["Üç dil", "Azərbaycan, rus və ingilis — qonaq özü seçir."],
      ["Masadan sifariş", "Qonaq masadan sifariş verir, mətbəx dərhal görür."],
      ["Dəyişiklik dərhal", "Qiymət dəyişdi — menyu yeniləndi. Yenidən çap yoxdur."],
    ],
    example: "Nümunəyə baxın",
    contact: "Əlaqə",
  },
  ru: {
    lead: "Один QR-код — и гость видит меню на своём телефоне.",
    title: "Цифровое меню для вашего ресторана",
    points: [
      ["Три языка", "Азербайджанский, русский и английский — гость выбирает сам."],
      ["Заказ со стола", "Гость заказывает за столом, кухня видит сразу."],
      ["Правки мгновенно", "Изменилась цена — меню обновилось. Без перепечатки."],
    ],
    example: "Посмотреть пример",
    contact: "Связаться",
  },
} as const;

function Panel({ lang }: { lang: "az" | "ru" }) {
  const copy = COPY[lang];

  return (
    <>
      {/* Headline first, then the sentence. The sentence was the eyebrow once,
          set in wide-tracked capitals — three heavy lines on a phone, outweighing
          the title it was meant to introduce. An eyebrow has to be short; this
          one is a whole thought, so it reads as a lead instead. */}
      <h1 className="font-serif text-[clamp(34px,8vw,56px)] leading-[1.08] text-gold-100">
        {copy.title}
      </h1>

      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-gold-100/50">{copy.lead}</p>

      <dl className="mt-12 space-y-px">
        {copy.points.map(([term, detail]) => (
          <div key={term} className="border-t border-gold-500/15 py-5 sm:flex sm:gap-8">
            <dt className="shrink-0 text-sm font-medium text-gold-100 sm:w-40">{term}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-gold-100/55 sm:mt-0">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-gold-500 px-7 py-3 text-sm font-medium text-[#120e08] transition hover:bg-gold-400"
        >
          {copy.contact}
        </a>
        <Link
          href="/lumiere"
          className="text-sm text-gold-100/55 underline decoration-gold-500/30 underline-offset-[6px] transition hover:text-gold-100"
        >
          {copy.example}
        </Link>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-20 sm:px-10">
      {/* One soft pool of light, off to the side — the whole decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/3 rounded-full opacity-[0.16] blur-[110px]"
        style={{ background: "radial-gradient(circle, #b8944f 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-2xl">
        {/* The radios sit here, not outside the wrapper: `peer` styles a later
            SIBLING, so a panel one level deeper never sees the checked state. */}
        <input type="radio" name="lang" id="lang-az" defaultChecked className="peer/az sr-only" />
        <input type="radio" name="lang" id="lang-ru" className="peer/ru sr-only" />

        <div className="mb-14 flex items-center justify-between">
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
          </div>
        </div>

        <div className="hidden peer-checked/az:block">
          <Panel lang="az" />
        </div>
        <div className="hidden peer-checked/ru:block">
          <Panel lang="ru" />
        </div>

        <footer className="mt-20 border-t border-gold-500/10 pt-6 text-xs text-gold-100/35">
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
