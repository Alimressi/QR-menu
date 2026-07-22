"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
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

type ClassSet = Record<DishCardVariant, string>;

const pick = (set: ClassSet, variant: DishCardVariant) => set[variant];

const CLASSES: Record<string, ClassSet> = {
  layout: {
    responsive: "flex sm:block",
    phone: "flex",
    desktop: "block",
  },
  image: {
    responsive: "relative w-[140px] shrink-0 overflow-hidden sm:aspect-[21/11] sm:w-full",
    phone: "relative w-[140px] shrink-0 overflow-hidden",
    desktop: "relative aspect-[21/11] w-full overflow-hidden",
  },
  body: {
    responsive: "flex min-w-0 flex-1 flex-col gap-2 p-3 sm:block sm:space-y-3 sm:p-4",
    phone: "flex min-w-0 flex-1 flex-col gap-2 p-3",
    desktop: "space-y-3 p-4",
  },
  titleRow: {
    responsive: "flex items-start justify-between gap-2 sm:gap-3",
    phone: "flex items-start justify-between gap-2",
    desktop: "flex items-start justify-between gap-3",
  },
  title: {
    responsive: "line-clamp-2 h-12 min-w-0 break-words font-serif text-base sm:line-clamp-none sm:h-auto sm:text-xl",
    phone: "line-clamp-2 h-12 min-w-0 break-words font-serif text-base",
    desktop: "min-w-0 break-words font-serif text-xl",
  },
  price: {
    responsive: "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none sm:px-3 sm:py-1.5 sm:text-[0.95rem]",
    phone: "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
    desktop: "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.95rem] font-semibold leading-none",
  },
  description: {
    responsive: "line-clamp-2 h-[33px] text-xs leading-snug sm:line-clamp-none sm:h-auto sm:text-sm sm:leading-6",
    phone: "line-clamp-2 h-[33px] text-xs leading-snug",
    desktop: "text-sm leading-6",
  },
  controls: {
    responsive: "mt-auto flex items-center gap-1.5 sm:mt-0 sm:gap-2",
    phone: "mt-auto flex items-center gap-1.5",
    desktop: "flex items-center gap-2",
  },
  qtyButton: {
    responsive: "min-h-10 min-w-10 rounded-lg border p-1.5 transition sm:min-h-11 sm:min-w-11 sm:p-2",
    phone: "min-h-10 min-w-10 rounded-lg border p-1.5 transition",
    desktop: "min-h-11 min-w-11 rounded-lg border p-2 transition",
  },
  qtyValue: {
    responsive: "min-w-6 text-center text-sm font-medium sm:min-w-8",
    phone: "min-w-6 text-center text-sm font-medium",
    desktop: "min-w-8 text-center text-sm font-medium",
  },
  addButton: {
    responsive: "ml-auto min-h-10 px-3 py-2 text-xs font-semibold transition hover:opacity-90 sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm",
    phone: "ml-auto min-h-10 px-3 py-2 text-xs font-semibold transition hover:opacity-90",
    desktop: "ml-auto min-h-11 px-4 py-2.5 text-sm font-semibold transition hover:opacity-90",
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
  qty?: number;
  /** Interactive menu wiring — omitted in previews, which render inert. */
  onOpen?: () => void;
  onQtyChange?: (delta: number) => void;
  onAdd?: () => void;
  /** Option <select> block, menu only. */
  optionsSlot?: ReactNode;
  /** Extra layer above the photo — the editor's framing handle. */
  imageOverlay?: ReactNode;
  /** Disables the hover zoom so a preview stays still. */
  staticImage?: boolean;
};

export function DishCard({
  dish,
  design,
  addLabel,
  variant = "responsive",
  qty = 1,
  onOpen,
  onQtyChange,
  onAdd,
  optionsSlot,
  imageOverlay,
  staticImage = false,
}: Props) {
  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <article
      className={`group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm ${pick(CLASSES.layout, variant)}`}
      onClick={onOpen}
      style={{
        borderRadius: design.cardRadius,
        borderColor: design.borderColor,
        background: design.surfaceColor,
      }}
    >
      <div className={pick(CLASSES.image, variant)}>
        <Image
          src={dish.imageUrl}
          alt={dish.name}
          fill
          sizes="(max-width: 640px) 140px, 420px"
          quality={95}
          className={`h-full w-full object-cover${staticImage ? "" : " transition duration-700 group-hover:scale-105"}`}
          style={{ objectPosition: `${dish.imagePositionX}% ${dish.imagePositionY}%` }}
        />
        {imageOverlay}
      </div>

      <div className={pick(CLASSES.body, variant)}>
        <div className={pick(CLASSES.titleRow, variant)}>
          <h3 className={pick(CLASSES.title, variant)} style={{ color: design.textColor }}>
            {dish.name}
          </h3>
          <p
            className={pick(CLASSES.price, variant)}
            style={{ backgroundColor: design.primaryColor, color: design.accentTextColor }}
          >
            {formatMenuPrice(dish.price, design.currencyMode)}
          </p>
        </div>

        <p className={pick(CLASSES.description, variant)} style={{ color: design.mutedTextColor }}>
          {dish.description}
        </p>

        <div className={pick(CLASSES.controls, variant)}>
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              onQtyChange?.(-1);
            }}
            className={pick(CLASSES.qtyButton, variant)}
            style={{
              borderColor: design.qtyButtonBorderColor,
              background: design.qtyButtonBackground,
              color: design.qtyButtonTextColor,
            }}
          >
            <Minus size={16} className="mx-auto" />
          </button>
          <span className={pick(CLASSES.qtyValue, variant)} style={{ color: design.textColor }}>
            {qty}
          </span>
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              onQtyChange?.(1);
            }}
            className={pick(CLASSES.qtyButton, variant)}
            style={{
              borderColor: design.qtyButtonBorderColor,
              background: design.qtyButtonBackground,
              color: design.qtyButtonTextColor,
            }}
          >
            <Plus size={16} className="mx-auto" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              stop(event);
              onAdd?.();
            }}
            className={pick(CLASSES.addButton, variant)}
            style={{
              borderRadius: design.buttonRadius,
              backgroundColor: design.primaryColor,
              color: design.accentTextColor,
            }}
          >
            {addLabel}
          </button>
        </div>

        {optionsSlot ? <div className={pick(CLASSES.options, variant)}>{optionsSlot}</div> : null}
      </div>
    </article>
  );
}
