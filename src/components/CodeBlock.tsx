"use client";

import { useRef, useState, useEffect } from "react";

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
