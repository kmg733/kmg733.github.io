import { useState, useCallback } from "react";

interface PreviewState {
  isVisible: boolean;
  imageSrc: string | null;
  imageAlt: string;
}

export function useImageHoverPreview() {
  const [state, setState] = useState<PreviewState>({
    isVisible: false,
    imageSrc: null,
    imageAlt: "",
  });

  const showPreview = useCallback((src: string, alt: string) => {
    setState({
      isVisible: true,
      imageSrc: src,
      imageAlt: alt,
    });
  }, []);

  const hidePreview = useCallback(() => {
    setState({
      isVisible: false,
      imageSrc: null,
      imageAlt: "",
    });
  }, []);

  return {
    ...state,
    showPreview,
    hidePreview,
  };
}
