export function scrollAndHighlight(
  target: HTMLElement | null,
  highlightClass: string = "glossary-highlight"
): void {
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth" });

  const applyHighlight = () => {
    target.classList.add(highlightClass);
    setTimeout(() => {
      target.classList.remove(highlightClass);
    }, 1500);
  };

  if ("onscrollend" in window) {
    let applied = false;
    const handler = () => {
      if (applied) return;
      applied = true;
      applyHighlight();
    };
    window.addEventListener("scrollend", handler, { once: true });
    setTimeout(() => {
      if (!applied) {
        window.removeEventListener("scrollend", handler);
        handler();
      }
    }, 1000);
  } else {
    setTimeout(applyHighlight, 500);
  }
}
