"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function ImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [mounted, setMounted] = useState(false);

  // Hydration 완료 후 마운트
  useEffect(() => {
    setMounted(true);
  }, []);

  // 라이트박스 닫기 애니메이션 시작
  const closeLightbox = useCallback(() => {
    if (isClosing) return; // 이미 닫기 중이면 무시
    setIsClosing(true);
  }, [isClosing]);

  // 애니메이션 완료 후 실제로 닫기
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      // 닫기 애니메이션(lightbox-fade-out)일 때만 처리
      if (e.animationName === "lightbox-fade-out") {
        setIsOpen(false);
        setImageSrc(null);
        setImageAlt("");
        setIsClosing(false);
        setIsLoading(true); // 다음 열기를 위해 로딩 상태 리셋
      }
    },
    []
  );

  // 이미지 로딩 완료 핸들러
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 이미지 로딩 실패 핸들러
  const handleImageError = useCallback(() => {
    setIsLoading(false);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeLightbox();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeLightbox]);

  // 이미지 클릭 이벤트 위임
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // .prose 내부의 img 요소만 처리
      if (
        target.tagName === "IMG" &&
        target.closest(".prose") &&
        !target.closest(".lightbox-overlay")
      ) {
        const img = target as HTMLImageElement;
        setImageSrc(img.src);
        setImageAlt(img.alt || "");
        setIsLoading(true); // 라이트박스 열 때 로딩 상태 초기화
        setIsOpen(true);
      }
    };

    document.addEventListener("click", handleImageClick);
    return () => document.removeEventListener("click", handleImageClick);
  }, []);

  // 서버 렌더링 시 또는 닫혀있을 때 렌더링하지 않음
  if (!mounted || !isOpen || !imageSrc) {
    return null;
  }

  return createPortal(
    <div
      className={`lightbox-overlay${isClosing ? " closing" : ""}`}
      onClick={closeLightbox}
      onAnimationEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label={imageAlt || "확대된 이미지"}
    >
      {/* 닫기 버튼 */}
      <button
        className="lightbox-close"
        onClick={closeLightbox}
        aria-label="이미지 닫기"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* 확대된 이미지 */}
      <div
        className={`lightbox-content${isClosing ? " closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 로딩 스피너 */}
        {isLoading && (
          <div
            className="lightbox-spinner"
            role="status"
            aria-label="이미지 로딩 중"
          />
        )}
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`lightbox-image${isLoading ? " loading" : " loaded"}`}
          onClick={closeLightbox}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>,
    document.body
  );
}
