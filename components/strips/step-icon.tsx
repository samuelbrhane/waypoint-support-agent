export type StepIconName = "think" | "search" | "rules" | "action" | "wait" | "done" | "person" | "error";

const PATHS: Record<StepIconName, React.ReactNode> = {
  think: <path d="M8 1.5 L9.6 6.4 L14.5 8 L9.6 9.6 L8 14.5 L6.4 9.6 L1.5 8 L6.4 6.4 Z" fill="currentColor" stroke="none" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.2 10.2 L13.8 13.8" />
    </>
  ),
  rules: <path d="M3 4.5 H13 M3 8 H13 M3 11.5 H9" />,
  action: <path d="M3 8 H12 M9 5 L12 8 L9 11" />,
  wait: <path d="M6 4.5 V11.5 M10 4.5 V11.5" />,
  done: <path d="M3.5 8.5 L6.5 11.5 L12.5 5" />,
  person: (
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3.5 13.5 C3.5 11 5.5 9.5 8 9.5 C10.5 9.5 12.5 11 12.5 13.5" />
    </>
  ),
  error: <path d="M5 5 L11 11 M11 5 L5 11" />,
};

export function StepIcon({ name, className = "" }: { name: StepIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}