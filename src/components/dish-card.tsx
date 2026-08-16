"use client";

import Image from "next/image";
import type { ReactNode } from "react";
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
      width="26"
      height="26"
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

const CLASSES: Record<string, ClassSet> = {
  layout: {
    responsive: "flex sm:block",
    phone: "flex",
    desktop: "block",
  },
  image: {
    // Phone: photo fills the whole card height (no white gaps above/below) as a
    // slim left panel. sm+: the original edge-to-edge 21:11 banner on top.
    responsive:
      "relative m-2 aspect-[4/3] w-[150px] shrink-0 self-center overflow-hidden rounded-xl sm:m-0 sm:aspect-[21/11] sm:w-full sm:self-auto sm:rounded-none",
    phone: "relative m-2 aspect-[4/3] w-[150px] shrink-0 self-center overflow-hidden rounded-xl",
    desktop: "relative aspect-[21/11] w-full overflow-hidden",
  },
  body: {
    responsive: "flex min-w-0 flex-1 flex-col gap-2 p-3 sm:block sm:space-y-3 sm:p-4",
    phone: "flex min-w-0 flex-1 flex-col gap-2 p-3",
    desktop: "space-y-3 p-4",
  },
  // On a phone the price sits UNDER the name rather than beside it.
  //
  // Side by side, the badge left the name 92px on a 375px screen — about seven
  // characters of the serif face at 20px. "Шоколадный" needs 109px, so it was
  // being split across two lines as "Шоколадны" + "й". Any Russian or Azerbaijani
  // word past seven letters had the same problem; it was not one bad dish name.
  //
  // Stacking gives the name the full 159px, which fits that word whole and lets
  // "Шоколадный фондан" fall into two clean lines. The two-line reserve below
  // (h-14) already accounted for names that wrap, so cards still line up.
  titleRow: {
    responsive: "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3",
    phone: "flex flex-col gap-1.5",
    desktop: "flex items-start justify-between gap-3",
  },
  title: {
    // `break-words` stays as a last resort: it only splits a word that cannot fit
    // a line on its own, which now takes a name far longer than any real dish.
    // Without it such a name would spill outside the card instead.
    responsive:
      "line-clamp-2 h-14 w-full min-w-0 break-words font-serif text-[20px] leading-tight sm:line-clamp-none sm:h-auto sm:w-auto sm:text-[26px]",
    phone: "line-clamp-2 h-14 w-full min-w-0 break-words font-serif text-[20px] leading-tight",
    desktop: "min-w-0 break-words font-serif text-[26px]",
  },
  // `self-start` keeps the badge hugging its text once the row became a column;
  // stretched full width it would read as a button rather than a price.
  price: {
    responsive:
      "w-fit shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none sm:px-3 sm:py-1.5 sm:text-[0.95rem]",
    phone: "w-fit shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
    desktop: "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.95rem] font-semibold leading-none",
  },
  description: {
    responsive: "line-clamp-2 h-[33px] text-xs leading-snug sm:line-clamp-none sm:h-auto sm:text-sm sm:leading-6",
    phone: "line-clamp-2 h-[33px] text-xs leading-snug",
    desktop: "text-sm leading-6",
  },
  controls: {
    responsive: "mt-auto sm:mt-0",
    phone: "mt-auto",
    desktop: "",
  },
  addButton: {
    responsive: "w-full min-h-10 py-2 text-center text-xs font-semibold transition hover:opacity-90 sm:min-h-11 sm:py-2.5 sm:text-sm",
    phone: "w-full min-h-10 py-2 text-center text-xs font-semibold transition hover:opacity-90",
    desktop: "w-full min-h-11 py-2.5 text-center text-sm font-semibold transition hover:opacity-90",
  },
  // The option picker is hidden on phones so every card keeps the same height.
  options: {
    responsive: "hidden sm:block",
    phone: "hidden",
    desktop: "block",
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

  // The photo-grid classes reserve fixed heights (2-line title, 33px description,
  // mt-auto button) so cards with photos line up. A text-only menu has nothing to
  // line up against, so it hugs its content instead — no empty gaps.
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
    ? "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold leading-none"
    : pick(CLASSES.price, variant);
  const descCls = textOnly ? "text-sm leading-snug" : pick(CLASSES.description, variant);
  const controlsCls = textOnly ? "mt-1" : pick(CLASSES.controls, variant);
  // Text-only menu has room for a roomier button; photo cards keep it compact.
  const buttonCls = textOnly
    ? "w-full min-h-11 py-2.5 text-center text-base font-semibold transition hover:opacity-90"
    : pick(CLASSES.addButton, variant);
  const optionsCls = textOnly ? "block" : pick(CLASSES.options, variant);

  return (
    <article
      // Photo-less cards are always block-flow (no side-by-side image column).
      className={`group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm ${
        showPhoto ? pick(CLASSES.layout, variant) : "block"
      }`}
      onClick={soldOut ? undefined : onOpen}
      style={{
        borderRadius: design.cardRadius,
        borderColor: design.borderColor,
        background: design.surfaceColor,
        opacity: soldOut ? 0.55 : 1,
      }}
    >
      {showPhoto ? (
        <div className={pick(CLASSES.image, variant)}>
          {hasPhoto ? (
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              sizes="(max-width: 640px) 140px, 420px"
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
              <span className="text-[10px] uppercase tracking-wider">No image</span>
            </div>
          )}
          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
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
          <p
            className={priceCls}
            style={{ backgroundColor: design.primaryColor, color: design.accentTextColor }}
          >
            {formatMenuPrice(dish.price, design.currencyMode)}
          </p>
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
            onClick={(event) => {
              stop(event);
              if (!soldOut) {
                onAdd?.();
              }
            }}
            className={buttonCls}
            style={{
              borderRadius: design.buttonRadius,
              // A stop-listed dish keeps the button in place so the grid does not
              // reflow, but it reads as unavailable rather than clickable.
              backgroundColor: soldOut ? design.qtyButtonBackground : design.primaryColor,
              color: soldOut ? design.mutedTextColor : design.accentTextColor,
              cursor: soldOut ? "not-allowed" : undefined,
            }}
          >
            {soldOut ? soldOutLabel : addLabel}
          </button>
        </div>

        {/* Picking an option is pointless when the dish cannot be ordered. */}
        {optionsSlot && !soldOut ? <div className={optionsCls}>{optionsSlot}</div> : null}
      </div>
    </article>
  );
}
