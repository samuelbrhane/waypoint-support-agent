"use client";

import { useEffect } from "react";

/** Turns on the scroll reveal, then marks each .reveal element visible as it scrolls on screen. */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const root = document.documentElement;
    const elements = document.querySelectorAll<HTMLElement>(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    root.setAttribute("data-reveal", "on");
    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      root.removeAttribute("data-reveal");
    };
  }, []);

  return null;
}