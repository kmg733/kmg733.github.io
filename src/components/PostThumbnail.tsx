import { THUMBNAIL_DEFAULTS } from "@/lib/constants";

interface PostThumbnailProps {
  thumbnail?: string;
  alt: string;
  className?: string;
}

export default function PostThumbnail({
  thumbnail,
  alt,
  className = "h-full w-full object-cover",
}: PostThumbnailProps) {
  const lightSrc = thumbnail
    ? `${thumbnail}-light.png`
    : THUMBNAIL_DEFAULTS.DEFAULT_LIGHT;
  const darkSrc = thumbnail
    ? `${thumbnail}-dark.png`
    : THUMBNAIL_DEFAULTS.DEFAULT_DARK;

  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        className={`${className} block dark:hidden`}
        loading="lazy"
      />
      <img
        src={darkSrc}
        alt={alt}
        className={`${className} hidden dark:block`}
        loading="lazy"
      />
    </>
  );
}
