import { Fragment } from "react";

const CODE = /\b(VM\d{3,4}|VT-\d{5})\b/g;

/** Show booking references, flight numbers and ticket numbers in monospace. */
export function formatAnswer(text: string) {
  return text.split(CODE).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="font-mono text-[0.95em] font-medium">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}