"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cardThumbUrl, isWorkerServedMedia } from "@/lib/media-url";
import type { CurrencyMode } from "@/lib/design";

// Single source of truth for how a dish looks in the guest menu — one layout at
// every width, so the super-admin's preview cannot drift from what a guest sees
// and there is no second design to keep in step.

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

/**
 * Zero-width spaces after the slashes in a name, so a line can end there.
 *
 * CSS offers no break after a solidus, so "Chicken/Shrimps/Salmon" is one
 * unbreakable word: the only way to fit it was `break-words` cutting mid-word,
 * and the card read "Chicken/Shrimps/S" then "almon". With a break opportunity
 * after each slash the whole word moves down instead.
 *
 * U+200B renders as nothing and collapses at a line end. `break-words` stays on
 * the heading as the last resort for a single word too long for a line by itself.
 */
function withWrapPoints(name: string) {
  return name.replace(/\//g, "/\u200B");
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

// A few values reach the markup as custom properties rather than inline styles.
// They are read by classes (`bg-[color:var(--dish-price-bg)]`) so that Tailwind
// still owns the rule; an inline style would win over the class and could not be
// varied per state. Every class name below is spelled out in full — Tailwind
// scans this file as text, so a name assembled at runtime is never generated.

// The photo card: one row, at every width. A 4:3 thumbnail on the left, the
// name, description and price stacked beside it, and a round "+" pinned to the
// bottom-right corner (`relative` on the <article> is what it hangs off).
const PHOTO = {
  layout: "relative flex items-stretch gap-3 p-2.5",

  // Sized to the row rather than the row to the photo, and left at the dishes'
  // own 4:3 — cropped square, a plated dish lost its sides. The 100px height is
  // what the card is built around: the gaps in the text column are set so the
  // text comes out the same height, and neither side leaves a band of empty card
  // above and below the other. The 133px width that ratio costs comes straight
  // out of the name's column, the tightest part of the row.
  image: "relative aspect-[4/3] h-25 w-auto shrink-0 self-center overflow-hidden rounded-2xl",

  // Pinned to the photo's height and spreading its lines over it, so slack lands
  // between them instead of as empty card above the name and below the price.
  // `pr-12` keeps the text clear of the round button in the corner.
  //
  // Name and price never yield; the description is the one that gives way when a
  // long name needs the room, and the rest of it is still there in the dish
  // sheet. The 10px minimum gap is picked so it gives way a whole line at a
  // time: once the column is over-full the gaps sit at that minimum, which
  // leaves the description exactly 100 - 47.5 (two-line name) - 20 - 16 =
  // 16.5px, one line to the pixel. A three-line name leaves -7.25px and it
  // disappears entirely. At a 6px minimum those same sums came out at 24.5px and
  // 0.8px — a line and a half, and a hairline of clipped letters.
  body: "flex h-25 min-w-0 flex-1 flex-col justify-between gap-y-2.5 pr-12",

  // The price is not beside the name — it is the last line of the text column.
  // `contents` dissolves this wrapper so the name and the price become siblings
  // of the description and can be ordered around it.
  titleRow: "contents",

  // `break-words` stays as a last resort: it only splits a word that cannot fit
  // a line on its own. Without it such a name would spill outside the card. A
  // name may run to three lines rather than be cut short.
  title:
    "order-1 shrink-0 line-clamp-3 min-w-0 break-words font-serif text-[19px] font-semibold leading-tight",
  description: "order-2 min-h-0 overflow-hidden line-clamp-2 text-[12px] leading-snug",
  price:
    "order-3 shrink-0 w-fit whitespace-nowrap text-[16px] font-medium leading-none text-[color:var(--dish-text)]",

  controls: "absolute bottom-2.5 right-2.5",
  // Icon-only: at 40px across there is no room for "Əlavə et". The label lives
  // on as the button's accessible name.
  addButton: "flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-90",
  // The badge has to fit inside a 133x100 thumbnail.
  soldOutBadge: "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
};

// A text-only menu has no photo to lay out against, so it keeps the stacked card
// and hugs its content — nothing to line up against means no reserved space.
const TEXT_ONLY = {
  layout: "relative block",
  body: "flex flex-col gap-1.5 p-4",
  titleRow: "flex items-start justify-between gap-3",
  title: "min-w-0 break-words font-serif text-[21px] leading-tight",
  description: "text-sm leading-snug",
  price:
    "shrink-0 whitespace-nowrap rounded-full bg-[color:var(--dish-price-bg)] px-3 py-1 text-sm font-semibold leading-none text-[color:var(--dish-price-fg)]",
  controls: "mt-1",
  addButton:
    "w-full min-h-11 rounded-[var(--dish-btn-radius)] py-2.5 text-center text-base font-semibold transition hover:opacity-90",
};

type Props = {
  dish: DishCardData;
  design: DishCardDesign;
  addLabel: string;
  /** Interactive menu wiring — omitted in previews, which render inert. */
  onOpen?: () => void;
  onAdd?: () => void;
  /** Option <select> block. Text-only menus have the room to show it inline. */
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

  const textOnly = !showPhoto;
  const cls = textOnly ? TEXT_ONLY : PHOTO;
  // A photo menu keeps its layout even before the photos arrive: a dish imported
  // in bulk has no imageUrl yet, and dropping it to the text-only layout would
  // make the grid jump around as photos are added one by one. It gets a
  // placeholder in the same slot instead. An empty src would throw in next/image.
  const hasPhoto = showPhoto && !!dish.imageUrl;

  return (
    <article
      className={`group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm ${cls.layout}`}
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
        <div className={PHOTO.image}>
          {hasPhoto ? (
            <Image
              src={cardThumbUrl(dish.imageUrl)}
              alt={dish.name}
              fill
              sizes="133px"
              quality={95}
              unoptimized={isWorkerServedMedia(dish.imageUrl)}
              // The small copy is written beside the photo by the import
              // script. If one is ever missing, the full photo still shows.
              onError={(event) => {
                const image = event.currentTarget;
                if (!image.src.endsWith(dish.imageUrl)) {
                  image.src = dish.imageUrl;
                }
              }}
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
                className={PHOTO.soldOutBadge}
                style={{ background: design.surfaceColor, color: design.textColor }}
              >
                {soldOutLabel}
              </span>
            </div>
          ) : null}
          {imageOverlay}
        </div>
      ) : null}

      <div className={cls.body}>
        <div className={cls.titleRow}>
          <h3 className={cls.title} style={{ color: design.textColor }}>
            {withWrapPoints(dish.name)}
          </h3>
          <p className={cls.price}>{formatMenuPrice(dish.price, design.currencyMode)}</p>
        </div>

        {/* An empty description would otherwise just add a blank gap. */}
        {!dish.description ? null : (
          <p className={cls.description} style={{ color: design.mutedTextColor }}>
            {dish.description}
          </p>
        )}

        {/* One clear "Add" (adds 1) — quantity is chosen in the dish modal. */}
        <div className={cls.controls}>
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
            className={cls.addButton}
            style={{
              // A stop-listed dish keeps the button in place so the grid does not
              // reflow, but it reads as unavailable rather than clickable.
              backgroundColor: soldOut ? design.qtyButtonBackground : design.primaryColor,
              color: soldOut ? design.mutedTextColor : design.accentTextColor,
              cursor: soldOut ? "not-allowed" : undefined,
            }}
          >
            {textOnly ? (
              soldOut ? soldOutLabel : addLabel
            ) : (
              <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* The photo row has no space for a <select>; those menus pick their
            option in the dish sheet instead. Picking one is pointless anyway
            when the dish cannot be ordered. */}
        {textOnly && optionsSlot && !soldOut ? <div className="block">{optionsSlot}</div> : null}
      </div>
    </article>
  );
}
