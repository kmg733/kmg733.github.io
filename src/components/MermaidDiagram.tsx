"use client";

import { useEffect, useState, useCallback } from "react";

let initialized = false;

async function ensureMermaidInit() {
  const mermaid = (await import("mermaid")).default;
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        fontFamily: "inherit",
      },
      flowchart: { useMaxWidth: false, htmlLabels: true },
      sequence: { useMaxWidth: false },
    });
    initialized = true;
  }
  return mermaid;
}

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = await ensureMermaidInit();
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

      try {
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch {
        if (!cancelled) {
          setSvg("");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  const handleClose = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded, handleClose]);

  if (!svg) {
    return (
      <pre className="mermaid-fallback">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <>
      <div className="mermaid-wrapper">
        <button
          className="mermaid-zoom-btn"
          onClick={() => setExpanded(true)}
          aria-label="확대"
        >
          ⤢ 확대
        </button>
        <div
          className="mermaid-diagram"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {expanded && (
        <div className="mermaid-overlay" onClick={handleClose}>
          <button
            className="mermaid-overlay-close"
            onClick={handleClose}
            aria-label="닫기"
          >
            ✕ ESC
          </button>
          <div
            className="mermaid-overlay-content"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </>
  );
}
