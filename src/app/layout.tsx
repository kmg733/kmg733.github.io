import type { Metadata } from "next";
import { Geist, Geist_Mono, Sacramento } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ImageLightbox from "@/components/ImageLightbox";
import SearchModal from "@/components/SearchModal";
import SearchButton from "@/components/SearchButton";
import { postService } from "@/lib/container";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  variable: "--font-sacramento",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Manuel",
    template: "%s | Manuel",
  },
  description: "Manuel의 기술 블로그",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allPosts = postService.getAllPosts();

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=s==='dark'||s==='light'?s:null;if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}document.documentElement.classList.add('no-transition')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sacramento.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="text-2xl font-bold font-[family-name:var(--font-sacramento)]">
              Manuel
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-amber-700 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-amber-700 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Blog
              </Link>
              <Link
                href="/projects"
                className="text-amber-700 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Projects
              </Link>
              <Link
                href="/about"
                className="text-amber-700 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                About
              </Link>
              <SearchButton />
              <ThemeToggle />
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <ImageLightbox />
        <SearchModal posts={allPosts} />

        <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
          <div className="mx-auto max-w-4xl px-4 text-center text-sm text-zinc-500">
            <p>&copy; {new Date().getFullYear()} Manuel. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
