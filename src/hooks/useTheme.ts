import { useEffect, useState } from "react";

/**
 * 현재 테마를 감지하는 커스텀 훅
 *
 * document.documentElement의 'dark' 클래스 유무를 MutationObserver로 감지하여
 * 현재 테마 상태를 반환한다. ThemeToggle 컴포넌트 수정 없이 테마 상태를 읽을 수 있다.
 */
export function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
