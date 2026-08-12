"use client";

import { parseMenuText, summarizeParse, type ParseResult } from "@/lib/menu-import";
import { useMemo, useState } from "react";

type Language = "az" | "ru" | "en";

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: "az", label: "Azərbaycan" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

// Matches the server's per-call cap. The browser walks the menu in chunks so a
// large import never exceeds the Worker's subrequest limit.
const TRANSLATE_CHUNK = 25;

type Props = {
  restaurantId: number;
  onImported: () => void | Promise<void>;
};

type Progress = { done: number; total: number } | null;

async function translateChunk(items: string[], from: Language, to: Language): Promise<string[]> {
  const response = await fetch("/api/superadmin/menu-import/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, from, to }),
    cache: "no-store",
  });

  if (!response.ok) {
    return items;
  }

  const data = (await response.json()) as { translations?: unknown };
  const translations = Array.isArray(data.translations) ? data.translations : null;

  if (!translations || translations.length !== items.length) {
    return items;
  }

  return translations.map((value, index) => (typeof value === "string" ? value : items[index]));
}

export function MenuImportPanel({ restaurantId, onImported }: Props) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>("az");
  const [shouldTranslate, setShouldTranslate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const summary = useMemo(() => (parsed ? summarizeParse(parsed) : null), [parsed]);

  function onParse() {
    setError("");
    setDone("");
    const result = parseMenuText(text);

    if (result.categories.length === 0) {
      setParsed(null);
      setError(
        "Ничего не распозналось. Нужен формат «Название — описание  12.00», каждое блюдо с новой строки, категории отдельной строкой без цены.",
      );
      return;
    }

    setParsed(result);
  }

  async function onImport() {
    if (!parsed || busy) {
      return;
    }

    setBusy(true);
    setError("");
    setDone("");

    try {
      const targets = LANGUAGES.map((l) => l.value).filter((l) => l !== sourceLanguage);

      // Every string that needs translating, flattened once so chunking is simple.
      const sources: string[] = [];
      for (const category of parsed.categories) {
        sources.push(category.name);
        for (const dish of category.dishes) {
          sources.push(dish.name, dish.description);
        }
      }

      const byLanguage: Record<Language, string[]> = {
        az: sources,
        ru: sources,
        en: sources,
      };

      if (shouldTranslate) {
        setProgress({ done: 0, total: targets.length * Math.ceil(sources.length / TRANSLATE_CHUNK) });
        let completed = 0;

        for (const target of targets) {
          const translated: string[] = [];

          for (let index = 0; index < sources.length; index += TRANSLATE_CHUNK) {
            const chunk = sources.slice(index, index + TRANSLATE_CHUNK);
            translated.push(...(await translateChunk(chunk, sourceLanguage, target)));
            completed += 1;
            setProgress({ done: completed, total: targets.length * Math.ceil(sources.length / TRANSLATE_CHUNK) });
          }

          byLanguage[target] = translated;
        }
      }

      // Walk the same order the strings were collected in.
      let cursor = 0;
      const pick = (language: Language) => byLanguage[language][cursor] ?? sources[cursor];

      const categories = parsed.categories.map((category) => {
        const categoryNames = {
          nameAz: pick("az"),
          nameRu: pick("ru"),
          nameEn: pick("en"),
        };
        cursor += 1;

        const dishes = category.dishes.map((dish) => {
          const names = { nameAz: pick("az"), nameRu: pick("ru"), nameEn: pick("en") };
          cursor += 1;
          const descriptions = {
            descriptionAz: pick("az"),
            descriptionRu: pick("ru"),
            descriptionEn: pick("en"),
          };
          cursor += 1;

          return { ...names, ...descriptions, price: dish.price, imageUrl: "" };
        });

        return { ...categoryNames, dishes };
      });

      setProgress(null);

      const response = await fetch("/api/superadmin/menu-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, categories }),
        cache: "no-store",
      });

      const data = (await response.json()) as { error?: string; categoryCount?: number; dishCount?: number };

      if (!response.ok) {
        setError(data.error || "Не удалось импортировать меню.");
        return;
      }

      setDone(`Добавлено: ${data.categoryCount} категорий, ${data.dishCount} блюд.`);
      setParsed(null);
      setText("");
      await onImported();
    } catch {
      setError("Не удалось импортировать меню.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-900 p-4">
      <h3 className="font-serif text-xl text-gold-100">Загрузить меню текстом</h3>
      <p className="mt-1 text-xs text-gold-500">
        Вставь меню как есть. Категория — строка без цены, блюдо — «Название — описание 12.00».
        Фото добавляются потом, по одному.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={"SALATLAR\nSezar — toyuq, parmezan, kahı  14.00\nYunan salatı  12.50\n\nŞORBALAR\nMastava  11.00"}
        className="mt-3 w-full rounded-lg border border-dark-600 bg-dark-800 p-3 font-mono text-sm text-gold-100 placeholder:text-dark-400"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onParse}
          disabled={busy || !text.trim()}
          className="min-h-11 rounded-lg border border-dark-600 bg-dark-800 px-4 text-sm text-gold-200 hover:bg-dark-700 disabled:opacity-40"
        >
          Разобрать
        </button>

        <label className="flex items-center gap-2 text-sm text-gold-300">
          Язык меню
          <select
            value={sourceLanguage}
            onChange={(event) => setSourceLanguage(event.target.value as Language)}
            className="min-h-11 rounded-lg border border-dark-600 bg-dark-800 px-2 text-gold-100"
          >
            {LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gold-300">
          <input
            type="checkbox"
            checked={shouldTranslate}
            onChange={(event) => setShouldTranslate(event.target.checked)}
          />
          Перевести на два других языка
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-emerald-400">{done}</p> : null}

      {parsed && summary ? (
        <div className="mt-4 rounded-xl border border-dark-600 bg-dark-800 p-3">
          <p className="text-sm text-gold-200">
            Распознано: <strong>{summary.categoryCount}</strong> категорий,{" "}
            <strong>{summary.dishCount}</strong> блюд, цены от {summary.minPrice.toFixed(2)} до{" "}
            {summary.maxPrice.toFixed(2)}
          </p>

          <div className="mt-3 max-h-72 overflow-y-auto pr-1">
            {parsed.categories.map((category) => (
              <div key={category.name} className="mb-3">
                <p className="text-sm font-semibold text-gold-300">{category.name}</p>
                <ul className="mt-1 space-y-0.5">
                  {category.dishes.map((dish, index) => (
                    <li key={`${dish.name}-${index}`} className="flex gap-2 text-xs text-gold-500">
                      <span className="min-w-0 flex-1 truncate">
                        {dish.name}
                        {dish.description ? ` — ${dish.description}` : ""}
                      </span>
                      <span className="shrink-0 tabular-nums">{dish.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {parsed.skipped.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-400">
                Пропущено строк: {parsed.skipped.length} — проверь, не потерялось ли блюдо
              </summary>
              <ul className="mt-1 space-y-0.5">
                {parsed.skipped.map((line, index) => (
                  <li key={index} className="truncate text-xs text-dark-400">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <button
            type="button"
            onClick={onImport}
            disabled={busy}
            className="mt-3 min-h-11 rounded-lg bg-gold-600 px-4 text-sm font-semibold text-dark-950 hover:bg-gold-500 disabled:opacity-40"
          >
            {busy
              ? progress
                ? `Перевод… ${progress.done}/${progress.total}`
                : "Добавляю…"
              : `Добавить в меню (${summary.dishCount} блюд)`}
          </button>

          <p className="mt-2 text-xs text-dark-400">
            Блюда добавляются к существующим, ничего не удаляется.
          </p>
        </div>
      ) : null}
    </div>
  );
}
