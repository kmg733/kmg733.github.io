"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  useImageHoverPreview,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from "@/hooks/useImageHoverPreview";

/** Lightbox(9999)보다 낮게, 일반 UI보다 높게 */
const HOVER_PREVIEW_Z_INDEX = 9998;

function isAllowedSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");
}

export default function ImageHoverPreview() {
  const { isVisible, imageSrc, imageAlt, position, showPreview, hidePreview } =
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

  // mouseover 이벤트 위임 (버블링 지원)
  useEffect(() => {
    if (!mounted || !supportsHover) {
      return () => {}; // 명시적 빈 클린업 (이슈 #4)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!isProseImage(target) || isLightboxOpen()) return;

      const img = target as HTMLImageElement;
      if (!img.src || !isAllowedSrc(img.src)) return; // 이슈 #1: 프로토콜 검증

      showPreview(img.src, img.alt || "", e.clientX, e.clientY);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "IMG") {
        hidePreview();
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [mounted, supportsHover, isProseImage, isLightboxOpen, showPreview, hidePreview]);

  if (!mounted || !isVisible || !imageSrc) {
    return null;
  }

  return createPortal(
    <div
      className="image-hover-preview"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: `${PREVIEW_WIDTH}px`,   // 이슈 #2: 상수 일원화
        maxHeight: `${PREVIEW_HEIGHT}px`,
        zIndex: HOVER_PREVIEW_Z_INDEX,    // 이슈 #3: 상수화
        pointerEvents: "none",
      }}
    >
      <img src={imageSrc} alt={imageAlt} />
    </div>,
    document.body
  );
}
