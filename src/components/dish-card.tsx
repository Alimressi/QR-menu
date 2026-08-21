"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { isWorkerServedMedia } from "@/lib/media-url";
import type { CurrencyMode } from "@/lib/design";

// Single source of truth for how a dish looks in the guest menu.
// The public menu renders it with variant="responsive"; the super-admin dish
// editor renders the very same component with variant="phone" / "desktop" so a
// preview can never drift from the real thing.

export type DishCardVariant = "responsive" | "phone" | "desktop";

/** The subset of a restaurant's design settings the card paints with. */
export type DishCardDesign = {
  cardRadius: string;
  buttonRadius: string;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  primaryColor: string;
  accentTextColor: string;
  qtyButtonBackground: string;
  qtyButtonTextColor: string;
  qtyButtonBorderColor: string;
  currencyMode: CurrencyMode;
};

export type DishCardData = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imagePositionX: number | string;
  imagePositionY: number | string;
  /** On the stop list: dimmed, labelled, and not orderable. */
  soldOut?: boolean;
};

/**
 * Price formatting as the guest menu shows it (manat renders as the ₼ symbol,
 * unlike the admin dashboards which spell the word out).
 */
export function formatMenuPrice(value: number, mode: CurrencyMode) {
  if (mode === "azn") {
    return `AZN ${value.toFixed(2)}`;
  }

  return `${value.toFixed(2)} ₼`;
}

/** Neutral photo placeholder — a framed picture with a mountain and a sun. */
function ImagePlaceholderIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ opacity: 0.55 }}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-4.5-4.5L9 19" />
    </svg>
  );
}

type ClassSet = Record<DishCardVariant, string>;

const pick = (set: ClassSet, variant: DishCardVariant) => set[variant];

// Colours and radii that differ between the phone row and the wide card (the
// price is a plain figure on a phone and a filled pill above sm) cannot live in
// `style` — an inline value has no breakpoints. They are published as custom
// properties on the <article> instead, so a single element picks the right one
// per width. Every class below is spelled out in full: Tailwind scans this file
// as text, so a name assembled at runtime would never be generated.

const CLASSES: Record<string, ClassSet> = {
  // Phone: one compact row — square photo, text column, round "+" pinned to the
  // bottom-right corner of the card (`relative` is what that button hangs off).
  // sm+: the original stacked card with an edge-to-edge banner on top.
  layout: {
    responsive: "relative flex items-stretch gap-3 p-2.5 sm:block sm:gap-0 sm:p-0",
    phone: "relative flex items-stretch gap-3 p-2.5",
    desktop: "relative block",
  },
  image: {
    // A square thumbnail, sized to the row rather than the row to the photo:
    // the card is now barely taller than the picture it carries.
    responsive:
      "relative h-[88px] w-[88px] shrink-0 self-center overflow-hidden rounded-2xl sm:aspect-[21/11] sm:h-auto sm:w-full sm:self-auto sm:rounded-none",
    phone: "relative h-[88px] w-[88px] shrink-0 self-center overflow-hidden rounded-2xl",
    desktop: "relative aspect-[21/11] w-full overflow-hidden",
  },
  // `pr-11` keeps the text clear of the round button in the corner.
  body: {
    responsive:
      "flex min-w-0 flex-1 flex-col justify-center gap-0.5 pr-11 sm:block sm:space-y-3 sm:p-4 sm:pr-4",
    phone: "flex min-w-0 flex-1 flex-col justify-center gap-0.5 pr-11",
    desktop: "space-y-3 p-4",
  },
  // On a phone the price is not beside the name — it sits under the description,
  // as the last line of the text column. `contents` dissolves this wrapper so
  // name and price become siblings of the description and can be re-ordered;
  // above sm the wrapper comes back as the usual name/price row.
  titleRow: {
    responsive: "contents sm:flex sm:items-start sm:justify-between sm:gap-3",
    phone: "contents",
    desktop: "flex items-start justify-between gap-3",
  },
  title: {
    // `break-words` stays as a last resort: it only splits a word that cannot fit
    // a line on its own. Without it such a name would spill outside the card.
    responsive:
      "order-1 line-clamp-2 min-w-0 break-words font-serif text-[17px] leading-tight sm:order-none sm:line-clamp-none sm:w-auto sm:text-[26px]",
    phone: "order-1 line-clamp-2 min-w-0 break-words font-serif text-[17px] leading-tight",
    desktop: "min-w-0 break-words font-serif text-[26px]",
  },
  price: {
    responsive:
      "order-3 mt-0.5 w-fit whitespace-nowrap text-[15px] font-semibold leading-none text-[color:var(--dish-text)] sm:order-none sm:mt-0 sm:shrink-0 sm:rounded-full sm:bg-[color:var(--dish-price-bg)] sm:px-3 sm:py-1.5 sm:text-[0.95rem] sm:text-[color:var(--dish-price-fg)]",
    phone: "order-3 mt-0.5 w-fit whitespace-nowrap text-[15px] font-semibold leading-none text-[color:var(--dish-text)]",
    desktop:
      "shrink-0 whitespace-nowrap rounded-full bg-[color:var(--dish-price-bg)] px-3 py-1.5 text-[0.95rem] font-semibold leading-none text-[color:var(--dish-price-fg)]",
  },
  description: {
    responsive: "order-2 line-clamp-1 text-[11px] leading-snug sm:order-none sm:line-clamp-none sm:text-sm sm:leading-6",
    phone: "order-2 line-clamp-1 text-[11px] leading-snug",
    desktop: "text-sm leading-6",
  },
  controls: {
    responsive: "absolute bottom-2.5 right-2.5 sm:static sm:mt-0",
    phone: "absolute bottom-2.5 right-2.5",
    desktop: "",
  },
  // Phone: an icon-only circle. sm+: the full-width labelled button.
  addButton: {
    responsive:
      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition hover:opacity-90 sm:h-auto sm:min-h-11 sm:w-full sm:rounded-[var(--dish-btn-radius)] sm:py-2.5",
    phone: "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition hover:opacity-90",
    desktop:
      "w-full min-h-11 rounded-[var(--dish-btn-radius)] py-2.5 text-center text-sm font-semibold transition hover:opacity-90",
  },
  // The option picker is hidden on phones so every card keeps the same height.
  options: {
    responsive: "hidden sm:block",
    phone: "hidden",
    desktop: "block",
  },
  // The badge has to fit inside an 88px thumbnail on a phone.
  soldOutBadge: {
    responsive:
      "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider sm:px-3 sm:py-1 sm:text-[11px]",
    phone: "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
    desktop: "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
  },
};

type Props = {
  dish: DishCardData;
  design: DishCardDesign;
  addLabel: string;
  variant?: DishCardVariant;
  /** Interactive menu wiring — omitted in previews, which render inert. */
  onOpen?: () => void;
  onAdd?: () => void;
  /** Option <select> block, menu only. */
  optionsSlot?: ReactNode;
  /** Extra layer above the photo — the editor's framing handle. */
  imageOverlay?: ReactNode;
  /** Disables the hover zoom so a preview stays still. */
  staticImage?: boolean;
  /** When false, the photo is dropped entirely and the card becomes text-only. */
  showPhoto?: boolean;
  /** Wording for the stop-list badge, in the guest's language. */
  soldOutLabel?: string;
};

export function DishCard({
  dish,
  design,
  addLabel,
  variant = "responsive",
  onOpen,
  onAdd,
  optionsSlot,
  imageOverlay,
  staticImage = false,
  showPhoto = true,
  soldOutLabel = "Sold out",
}: Props) {
  // A dish on the stop list stays visible — guests should still see what the
  // kitchen normally offers — but it is dimmed, labelled, and cannot be ordered.
  const soldOut = dish.soldOut === true;
  const stop = (event: React.MouseEvent) => event.stopPropagation();

  // A text-only menu has no photo row to lay out against, so it keeps the
  // stacked card and hugs its content instead — no empty gaps.
  const textOnly = !showPhoto;
  // A photo menu keeps its layout even before the photos arrive: a dish imported
  // in bulk has no imageUrl yet, and dropping it to the text-only layout would
  // make the grid jump around as photos are added one by one. It gets a
  // placeholder in the same slot instead. An empty src would throw in next/image.
  const hasPhoto = showPhoto && !!dish.imageUrl;
  const bodyCls = textOnly ? "flex flex-col gap-1.5 p-4" : pick(CLASSES.body, variant);
  const titleRowCls = textOnly ? "flex items-start justify-between gap-3" : pick(CLASSES.titleRow, variant);
  const titleCls = textOnly ? "min-w-0 break-words font-serif text-[21px] leading-tight" : pick(CLASSES.title, variant);
  const priceCls = textOnly
    ? "shrink-0 whitespace-nowrap rounded-full bg-[color:var(--dish-price-bg)] px-3 py-1 text-sm font-semibold leading-none text-[color:var(--dish-price-fg)]"
    : pick(CLASSES.price, variant);
  const descCls = textOnly ? "text-sm leading-snug" : pick(CLASSES.description, variant);
  const controlsCls = textOnly ? "mt-1" : pick(CLASSES.controls, variant);
  // Text-only menu has room for a roomier button; photo cards keep it compact.
  const buttonCls = textOnly
    ? "w-full min-h-11 rounded-[var(--dish-btn-radius)] py-2.5 text-center text-base font-semibold transition hover:opacity-90"
    : pick(CLASSES.addButton, variant);
  const optionsCls = textOnly ? "block" : pick(CLASSES.options, variant);
  // The compact button carries a "+" instead of the word: at 36px across there
  // is no room for "Əlavə et". The label lives on as the accessible name.
  const showAddIcon = !textOnly && variant !== "desktop";
  const showAddLabel = textOnly || variant !== "phone";
  const addLabelCls = !textOnly && variant === "responsive" ? "hidden sm:inline" : undefined;

  return (
    <article
      // Photo-less cards are always block-flow (no side-by-side image column).
      className={`group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm ${
        showPhoto ? pick(CLASSES.layout, variant) : "relative block"
      }`}
      onClick={soldOut ? undefined : onOpen}
      style={
        {
          borderRadius: design.cardRadius,
          borderColor: design.borderColor,
          background: design.surfaceColor,
          opacity: soldOut ? 0.55 : 1,
          "--dish-btn-radius": design.buttonRadius,
          "--dish-price-bg": design.primaryColor,
          "--dish-price-fg": design.accentTextColor,
          "--dish-text": design.textColor,
        } as CSSProperties
      }
    >
      {showPhoto ? (
        <div className={pick(CLASSES.image, variant)}>
          {hasPhoto ? (
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              sizes="(max-width: 640px) 176px, 420px"
              quality={95}
              unoptimized={isWorkerServedMedia(dish.imageUrl)}
              className={`h-full w-full object-cover${staticImage ? "" : " transition duration-700 group-hover:scale-105"}`}
              style={{ objectPosition: `${dish.imagePositionX}% ${dish.imagePositionY}%` }}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-1"
              style={{
                background: design.qtyButtonBackground,
                color: design.mutedTextColor,
              }}
            >
              <ImagePlaceholderIcon />
              <span className="text-[9px] uppercase tracking-wider">No image</span>
            </div>
          )}
          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-1">
              <span
                className={pick(CLASSES.soldOutBadge, variant)}
                style={{ background: design.surfaceColor, color: design.textColor }}
              >
                {soldOutLabel}
              </span>
            </div>
          ) : null}
          {imageOverlay}
        </div>
      ) : null}

      <div className={bodyCls}>
        <div className={titleRowCls}>
          <h3 className={titleCls} style={{ color: design.textColor }}>
            {dish.name}
          </h3>
          <p className={priceCls}>{formatMenuPrice(dish.price, design.currencyMode)}</p>
        </div>

        {/* In text-only mode an empty description would just add a blank gap. */}
        {textOnly && !dish.description ? null : (
          <p className={descCls} style={{ color: design.mutedTextColor }}>
            {dish.description}
          </p>
        )}

        {/* One clear "Add" (adds 1) — quantity is chosen in the dish modal. */}
        <div className={controlsCls}>
          <button
            type="button"
            disabled={soldOut}
            aria-label={soldOut ? soldOutLabel : addLabel}
            onClick={(event) => {
              stop(event);
              if (!soldOut) {
                onAdd?.();
              }
            }}
            className={buttonCls}
            style={{
              // A stop-listed dish keeps the button in place so the grid does not
              // reflow, but it reads as unavailable rather than clickable.
              backgroundColor: soldOut ? design.qtyButtonBackground : design.primaryColor,
              color: soldOut ? design.mutedTextColor : design.accentTextColor,
              cursor: soldOut ? "not-allowed" : undefined,
            }}
          >
            {showAddIcon ? (
              <Plus
                size={18}
                strokeWidth={2.5}
                aria-hidden="true"
                className={variant === "responsive" ? "sm:hidden" : undefined}
              />
            ) : null}
            {showAddLabel ? (
              <span className={addLabelCls}>{soldOut ? soldOutLabel : addLabel}</span>
            ) : null}
          </button>
        </div>

        {/* Picking an option is pointless when the dish cannot be ordered. */}
        {optionsSlot && !soldOut ? <div className={optionsCls}>{optionsSlot}</div> : null}
      </div>
    </article>
  );
}
