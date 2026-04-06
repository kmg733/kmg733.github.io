"use client";

import { useRef, useState, useEffect } from "react";
import MermaidDiagram from "./MermaidDiagram";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    const el = node as React.ReactElement<Record<string, unknown>>;
    const text = extractText(el.props.children as React.ReactNode);
    // Shiki는 각 라인을 data-line 속성이 있는 span으로 감싼다.
    // 라인 끝에 개행을 추가해야 mermaid 등 코드 파서가 정상 동작한다.
    if (el.props["data-line"] !== undefined) {
      return text + "\n";
    }
    return text;
  }
  return "";
}

function CopyIcon() {
  return (
    <svg
      className="icon-copy"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="icon-check"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface CodeBlockProps {
  children: React.ReactNode;
  "data-language"?: string;
  [key: string]: unknown;
}

export default function CodeBlock({
  children,
  "data-language": language,
  ...props
}: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Mermaid 코드블록 감지 및 렌더링
  if (language === "mermaid") {
    const code = extractText(children);
    return <MermaidDiagram chart={code.trim()} />;
  }

  const handleCopy = async () => {
    const code = preRef.current?.querySelector("code")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 불가 시 조용히 실패
    }
  };

  return (
    <div className="code-block-wrapper">
      {language ? (
        <div className="code-block-header">
          <span>{language}</span>
          <button
            onClick={handleCopy}
            className="code-copy-button"
            aria-label="Copy code"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      ) : (
        <button
          onClick={handleCopy}
          className="code-copy-button code-copy-button-floating"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
}
