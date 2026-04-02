"use client";

import { useState, useEffect } from "react";
import Giscus from "@giscus/react";
import { useTheme } from "@/hooks/useTheme";
import { GISCUS_CONFIG } from "@/lib/giscus-config";

export default function GiscusComments() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section className="mt-16">
      <hr className="mb-8 border-zinc-200 dark:border-zinc-700" />
      <Giscus
        {...GISCUS_CONFIG}
        theme={theme === "dark" ? "dark_dimmed" : "light"}
      />
    </section>
  );
}
