"use client";

import { useState, useEffect } from "react";

interface TypeWriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function TypeWriter({
  words,
  typingSpeed = 120,
  deletingSpeed = 60,
  pauseDuration = 2000,
  className = "",
}: TypeWriterProps) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (words.length === 0) return;

    if (isReducedMotion) {
      setText(words[0]);
      return;
    }

    const currentWord = words[wordIndex];

    // 타이핑 완료 → 일시 정지 후 삭제 시작
    if (!isDeleting && text === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      return () => clearTimeout(timeout);
    }

    // 삭제 완료 → 다음 단어로
    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));
      } else {
        setText(currentWord.substring(0, text.length + 1));
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [
    text,
    isDeleting,
    wordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    isReducedMotion,
  ]);

  if (words.length === 0) {
    return <span className={className} />;
  }

  if (isReducedMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={className}>
      <span aria-hidden="true">
        {text}
        <span
          className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5"
          style={{
            animation: "typewriter-cursor 0.7s steps(1) infinite",
          }}
        />
      </span>
      <span className="sr-only">{words[wordIndex]}</span>
    </span>
  );
}
