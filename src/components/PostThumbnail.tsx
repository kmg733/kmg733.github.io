"use client";

import { useState, useRef, useEffect } from "react";
import { THUMBNAIL_DEFAULTS } from "@/lib/constants";
import blurDataMap from "@/lib/thumbnail-blur-data.json";

interface PostThumbnailProps {
  thumbnail?: string;
  alt: string;
  className?: string;
}

function getBlurData(pngSrc: string): string | undefined {
  const value = (blurDataMap as Record<string, string>)[pngSrc];
  return value?.startsWith("data:image/") ? value : undefined;
}

const PNG_TO_WEBP = /\.png$/i;

function blurStyle(
  loaded: boolean,
  blurUrl?: string
): React.CSSProperties | undefined {
  if (!blurUrl) return undefined;
  return {
    backgroundImage: loaded ? "none" : `url(${blurUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function PostThumbnail({
  thumbnail,
  alt,
  className = "h-full w-full object-cover",
}: PostThumbnailProps) {
  const [lightLoaded, setLightLoaded] = useState(false);
  const [darkLoaded, setDarkLoaded] = useState(false);
  const lightRef = useRef<HTMLImageElement>(null);
  const darkRef = useRef<HTMLImageElement>(null);

  // 이미지가 이미 캐시/로드 완료된 경우 onLoad가 안 불릴 수 있으므로 마운트 시 체크
  useEffect(() => {
    if (lightRef.current?.complete && lightRef.current.naturalWidth > 0) {
      setLightLoaded(true);
    }
    if (darkRef.current?.complete && darkRef.current.naturalWidth > 0) {
      setDarkLoaded(true);
    }
  }, []);

  const lightPng = thumbnail
    ? `${thumbnail}-light.png`
    : THUMBNAIL_DEFAULTS.DEFAULT_LIGHT;
  const darkPng = thumbnail
    ? `${thumbnail}-dark.png`
    : THUMBNAIL_DEFAULTS.DEFAULT_DARK;

  const lightWebp = lightPng.replace(PNG_TO_WEBP, ".webp");
  const darkWebp = darkPng.replace(PNG_TO_WEBP, ".webp");

  const lightBlur = getBlurData(lightPng);
  const darkBlur = getBlurData(darkPng);

  return (
    <>
      <div
        className="block h-full w-full dark:hidden"
        style={blurStyle(lightLoaded, lightBlur)}
      >
        <picture>
          <source srcSet={lightWebp} type="image/webp" />
          <img
            ref={lightRef}
            src={lightPng}
            alt={alt}
            width={640}
            height={427}
            className={`${className} transition-opacity duration-300 ${lightLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setLightLoaded(true)}
          />
        </picture>
      </div>

      <div
        className="hidden h-full w-full dark:block"
        style={blurStyle(darkLoaded, darkBlur)}
      >
        <picture>
          <source srcSet={darkWebp} type="image/webp" />
          <img
            ref={darkRef}
            src={darkPng}
            alt="" /* 라이트 이미지와 동일 콘텐츠 - 스크린 리더 중복 읽기 방지 */
            width={640}
            height={427}
            className={`${className} transition-opacity duration-300 ${darkLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setDarkLoaded(true)}
          />
        </picture>
      </div>
    </>
  );
}
