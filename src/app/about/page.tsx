import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "개발자 소개",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">About Me</h1>

      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          안녕하세요! 소프트웨어 개발자입니다.
        </p>

        <h2>Skills</h2>
        <ul>
          <li>Frontend: React, Next.js, TypeScript</li>
          <li>Backend: Node.js, Java, Spring</li>
          <li>Database: PostgreSQL, MySQL, MongoDB</li>
          <li>DevOps: Docker, AWS, GitHub Actions</li>
        </ul>

        <h2>Experience</h2>
        <p>
          이곳에 경력 사항을 작성하세요.
        </p>

        <h2>Contact</h2>
        <ul>
          <li>
            GitHub:{" "}
            <a
              href="https://github.com/kmg733"
              target="_blank"
              rel="noopener noreferrer"
            >
              @kmg733
            </a>
          </li>
          <li>Email: your-email@example.com</li>
        </ul>
      </div>
    </div>
  );
}
