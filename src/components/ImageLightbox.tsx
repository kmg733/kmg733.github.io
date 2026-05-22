"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useTheme } from "@/hooks/useTheme";
import { useSwipe } from "@/hooks/useSwipe";
import { collectGalleryAt, type GalleryImage } from "@/utils/galleryImages";

export default function ImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 클릭 시점의 현재 테마를 읽기 위한 ref (이벤트 핸들러는 1회 등록되어 stale 클로저 방지)
  // useFocusTrap / useKeyboardShortcut 와 동일한 렌더 중 ref 동기화 관용구를 따른다.
  const theme = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const currentImage = images[currentIndex] ?? null;
  const total = images.length;
  const hasMultiple = total > 1;

  // Hydration 완료 후 마운트
  useEffect(() => {
    setMounted(true);
  }, []);

  // 라이트박스 닫기 애니메이션 시작
  const closeLightbox = useCallback(() => {
    if (isClosing) return; // 이미 닫기 중이면 무시
    setIsClosing(true);
  }, [isClosing]);

  // 특정 인덱스로 이동 (clamp: 범위 밖/동일 인덱스는 no-op)
  // 실제 이동이 발생할 때만 로딩 상태를 리셋해 경계/동일 이미지에서 스피너가 멈추지 않게 한다.
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= total) return;
      if (index === currentIndex) return;
      setIsLoading(true);
      setCurrentIndex(index);
    },
    [currentIndex, total]
  );

  // 이전/다음 이미지로 이동
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // 모바일 터치 스와이프 (왼쪽 → 다음, 오른쪽 → 이전)
  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  // 포커스 트랩 훅 연결
  const { containerRef } = useFocusTrap({
    isActive: isOpen && !isClosing,
    onEscape: closeLightbox,
  });

  // 애니메이션 완료 후 실제로 닫기
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      // 닫기 애니메이션(lightbox-fade-out)일 때만 처리
      if (e.animationName === "lightbox-fade-out") {
        setIsOpen(false);
        setImages([]);
        setCurrentIndex(0);
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

  // 캐시된 이미지는 마운트 시점에 이미 complete=true 이고 onLoad가
  // 발화하지 않을 수 있어, 스피너가 멈추지 않는 문제를 방지한다.
  // key={src}로 이미지 전환 시 재마운트되어 매 이미지마다 1회 실행된다.
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) {
      setIsLoading(false);
    }
  }, []);

  // 현재 활성 썸네일 (currentIndex 변경 시 화면 안으로 스크롤)
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  // 이미지 로딩 실패 핸들러
  const handleImageError = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 스크롤 방지 (ESC 키는 useFocusTrap에서 처리)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 좌우 화살표 키 네비게이션 (ESC/Tab은 useFocusTrap이 담당)
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, goPrev, goNext]);

  // 활성 썸네일을 필름스트립 안에서 보이도록 스크롤 (세로/가로 모두 대응)
  // scrollIntoView 미지원 환경(SSR/구형/jsdom)에서는 옵셔널 체이닝으로 안전하게 생략
  useEffect(() => {
    if (!isOpen) return;
    activeThumbRef.current?.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
    });
  }, [currentIndex, isOpen]);

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
        const prose = img.closest(".prose") as HTMLElement;
        const currentTheme = themeRef.current;

        // 포커스 복원을 위해 클릭된 이미지를 포커스 가능하게 만들고 포커스
        if (img.tabIndex < 0) {
          img.tabIndex = 0;
        }
        img.focus();

        const { images: collected, startIndex } = collectGalleryAt(
          prose,
          currentTheme,
          img
        );

        setImages(collected);
        setCurrentIndex(startIndex >= 0 ? startIndex : 0);
        setIsLoading(true); // 라이트박스 열 때 로딩 상태 초기화
        setIsOpen(true);
      }
    };

    document.addEventListener("click", handleImageClick);
    return () => document.removeEventListener("click", handleImageClick);
  }, []);

  // 서버 렌더링 시 또는 닫혀있을 때 렌더링하지 않음
  if (!mounted || !isOpen || !currentImage) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      className={`lightbox-overlay${isClosing ? " closing" : ""}`}
      onClick={closeLightbox}
      onAnimationEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label={currentImage.alt || "확대된 이미지"}
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

      {/* 이전 버튼 (이미지 2개 이상일 때만) */}
      {hasMultiple && (
        <button
          className="lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={currentIndex === 0}
          aria-label="이전 이미지"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* 확대된 이미지 */}
      <div
        className={`lightbox-content${isClosing ? " closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
        onTouchCancel={swipeHandlers.onTouchCancel}
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
          key={currentImage.src}
          ref={imageRef}
          src={currentImage.src}
          alt={currentImage.alt}
          className={`lightbox-image${isLoading ? " loading" : " loaded"}`}
          onClick={closeLightbox}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* 다음 버튼 (이미지 2개 이상일 때만) */}
      {hasMultiple && (
        <button
          className="lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          disabled={currentIndex === total - 1}
          aria-label="다음 이미지"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* 위치 인디케이터 (이미지 2개 이상일 때만) */}
      {/* role="status"가 aria-live="polite"와 aria-atomic을 암묵 포함하므로 중복 선언하지 않는다 */}
      {hasMultiple && (
        <div className="lightbox-counter" role="status">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* 썸네일 필름스트립 (이미지 2개 이상일 때만) */}
      {/* 닫기 버튼 뒤(DOM 마지막)에 배치해 자동 첫 포커스 대상이 닫기 버튼으로 유지된다 */}
      {hasMultiple && (
        <div
          className="lightbox-filmstrip"
          role="group"
          aria-label="이미지 목록"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => {
            const isActive = i === currentIndex;
            return (
              <button
                key={`${i}-${img.src}`}
                ref={isActive ? activeThumbRef : null}
                className={`lightbox-thumb${isActive ? " active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                aria-label={`${i + 1}번째 이미지 보기`}
                aria-current={isActive ? "true" : undefined}
                type="button"
              >
                <img src={img.src} alt="" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
}
