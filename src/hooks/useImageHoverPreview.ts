import { useState, useCallback } from "react";

export const PREVIEW_WIDTH = 400;
export const PREVIEW_HEIGHT = 300;
export const PREVIEW_OFFSET = 20;

interface PreviewState {
  isVisible: boolean;
  imageSrc: string | null;
  imageAlt: string;
  position: { x: number; y: number };
}

export function useImageHoverPreview() {
  const [state, setState] = useState<PreviewState>({
    isVisible: false,
    imageSrc: null,
    imageAlt: "",
    position: { x: 0, y: 0 },
  });

  const calculatePosition = useCallback((mouseX: number, mouseY: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = mouseX + PREVIEW_OFFSET;
    let y = mouseY + PREVIEW_OFFSET;

    // 오른쪽 경계 초과 시 마우스 왼쪽에 표시
    if (x + PREVIEW_WIDTH > viewportWidth) {
      x = mouseX - PREVIEW_WIDTH - PREVIEW_OFFSET;
    }

    // 하단 경계 초과 시 마우스 위쪽에 표시
    if (y + PREVIEW_HEIGHT > viewportHeight) {
      y = mouseY - PREVIEW_HEIGHT - PREVIEW_OFFSET;
    }

    // 최소 경계 보정
    x = Math.max(PREVIEW_OFFSET, x);
    y = Math.max(PREVIEW_OFFSET, y);

    return { x, y };
  }, []);

  const showPreview = useCallback(
    (src: string, alt: string, mouseX: number, mouseY: number) => {
      const position = calculatePosition(mouseX, mouseY);
      setState({
        isVisible: true,
        imageSrc: src,
        imageAlt: alt,
        position,
      });
    },
    [calculatePosition]
  );

  const hidePreview = useCallback(() => {
    setState({
      isVisible: false,
      imageSrc: null,
      imageAlt: "",
      position: { x: 0, y: 0 },
    });
  }, []);

  return {
    ...state,
    showPreview,
    hidePreview,
  };
}
