"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useImageHoverPreview } from "@/hooks/useImageHoverPreview";

/** Lightbox(9999)보다 낮게, 일반 UI보다 높게 */
const HOVER_PREVIEW_Z_INDEX = 9998;

/** URL 객체 기반 프로토콜 정규화로 대소문자 우회 방지 */
function isAllowedSrc(src: string): boolean {
  try {
    const url = new URL(src, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return src.startsWith("/");
  }
}

export default function ImageHoverPreview() {
  const { isVisible, imageSrc, imageAlt, showPreview, hidePreview } =
    useImageHoverPreview();
  const [mounted, setMounted] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    setMounted(true);
    setSupportsHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const isProseImage = useCallback((target: HTMLElement): boolean => {
    return target.tagName === "IMG" && !!target.closest(".prose");
  }, []);

  const isLightboxOpen = useCallback((): boolean => {
    return !!document.querySelector(".lightbox-overlay");
  }, []);

  // mouseover/mouseout 이벤트 위임
  useEffect(() => {
    if (!mounted || !supportsHover) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!isProseImage(target) || isLightboxOpen()) return;

      const img = target as HTMLImageElement;
      if (!img.src || !isAllowedSrc(img.src)) return;

      showPreview(img.src, img.alt || "");
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "IMG") {
        hidePreview();
      }
    };

    // 프리뷰 해제: scroll, Escape, 탭 전환
    const handleScroll = () => hidePreview();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hidePreview();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) hidePreview();
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mounted, supportsHover, isProseImage, isLightboxOpen, showPreview, hidePreview]);

  if (!mounted || !isVisible || !imageSrc) {
    return null;
  }

  return createPortal(
    <div
      className="image-hover-preview"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: HOVER_PREVIEW_Z_INDEX,
        pointerEvents: "none",
      }}
    >
      <img src={imageSrc} alt={imageAlt} />
    </div>,
    document.body
  );
}
