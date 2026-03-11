'use client';

/**
 * CodeWindow - macOS 스타일 코드 윈도우 자기소개 컴포넌트
 *
 * TypeScript 객체 리터럴 형태로 자기소개를 표시한다.
 * Shiki 없이 span + className으로 정적 구문 강조를 구현한다.
 */

type TokenType = 'keyword' | 'variable' | 'property' | 'string' | 'bracket' | 'punctuation' | 'plain';

interface Token {
  type: TokenType;
  text: string;
}

interface CodeLine {
  number: number;
  tokens: Token[];
}

// 구문 강조 토큰 정의
const codeLines: CodeLine[] = [
  {
    number: 1,
    tokens: [
      { type: 'keyword', text: 'const' },
      { type: 'plain', text: ' ' },
      { type: 'variable', text: 'developer' },
      { type: 'plain', text: ' = ' },
      { type: 'bracket', text: '{' },
    ],
  },
  {
    number: 2,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'name' },
      { type: 'punctuation', text: ': ' },
      { type: 'string', text: '"MinGyu"' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 3,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'role' },
      { type: 'punctuation', text: ': ' },
      { type: 'string', text: '"Full-Stack Developer"' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 4,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'stack' },
      { type: 'punctuation', text: ': ' },
      { type: 'bracket', text: '[' },
      { type: 'string', text: '"Java"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"Spring Boot"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"React"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"TypeScript"' },
      { type: 'bracket', text: ']' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 5,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'database' },
      { type: 'punctuation', text: ': ' },
      { type: 'bracket', text: '[' },
      { type: 'string', text: '"PostgreSQL"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"MariaDB"' },
      { type: 'bracket', text: ']' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 6,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'tools' },
      { type: 'punctuation', text: ': ' },
      { type: 'bracket', text: '[' },
      { type: 'string', text: '"Git"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"GitHub"' },
      { type: 'punctuation', text: ', ' },
      { type: 'string', text: '"GitLab"' },
      { type: 'bracket', text: ']' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 7,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'passion' },
      { type: 'punctuation', text: ': ' },
      { type: 'string', text: '"기술 블로그 운영"' },
      { type: 'punctuation', text: ',' },
    ],
  },
  {
    number: 8,
    tokens: [
      { type: 'plain', text: '  ' },
      { type: 'property', text: 'goal' },
      { type: 'punctuation', text: ': ' },
      { type: 'string', text: '"끊임없이 성장하는 개발자"' },
    ],
  },
  {
    number: 9,
    tokens: [
      { type: 'bracket', text: '}' },
      { type: 'punctuation', text: ';' },
    ],
  },
];

// 토큰 타입별 className 매핑
const tokenClassMap: Record<TokenType, string> = {
  keyword:     'text-purple-600 dark:text-purple-400',
  variable:    'text-blue-600 dark:text-blue-400',
  property:    'text-amber-700 dark:text-red-400',
  string:      'text-green-600 dark:text-green-400',
  bracket:     'text-zinc-500 dark:text-zinc-400',
  punctuation: 'text-zinc-500 dark:text-zinc-400',
  plain:       'text-zinc-700 dark:text-zinc-300',
};

export default function CodeWindow() {
  return (
    <article
      aria-label="코드 형태 자기소개"
      className={[
        // 윈도우 전체
        'relative overflow-hidden rounded-xl border shadow-xl',
        'font-mono text-xs sm:text-sm',
        // 글래스 효과
        'backdrop-blur-[10px]',
        // 라이트 모드
        'bg-amber-50/90 border-amber-200',
        // 다크 모드
        'dark:bg-slate-900/90 dark:border-slate-700',
      ].join(' ')}
    >
      {/* 타이틀바 */}
      <div
        className={[
          'flex items-center gap-2 px-4 py-3 border-b select-none',
          'bg-amber-100/80 border-amber-200',
          'dark:bg-slate-800/80 dark:border-slate-700',
        ].join(' ')}
        aria-hidden="true"
      >
        {/* macOS 트래픽 신호등 */}
        <div className="flex items-center gap-1.5">
          <span className="block h-3 w-3 rounded-full bg-red-400/90 dark:bg-red-500/80" />
          <span className="block h-3 w-3 rounded-full bg-yellow-400/90 dark:bg-yellow-500/80" />
          <span className="block h-3 w-3 rounded-full bg-green-400/90 dark:bg-green-500/80" />
        </div>

        {/* 파일 이름 */}
        <span className="ml-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          about-mingyu.ts
        </span>
      </div>

      {/* 코드 본문 */}
      <pre
        className="overflow-x-auto p-4 sm:p-5 leading-relaxed"
        // prefers-reduced-motion: 타이핑 애니메이션이 없으므로 별도 처리 불필요
      >
        <code>
          {codeLines.map((line) => (
            <div key={line.number} className="flex">
              {/* 라인 번호 */}
              <span
                className="mr-4 w-5 shrink-0 text-right text-zinc-400 dark:text-zinc-600 select-none"
                aria-hidden="true"
              >
                {line.number}
              </span>

              {/* 토큰 렌더링 */}
              <span>
                {line.tokens.map((token, idx) => (
                  <span
                    key={idx}
                    className={tokenClassMap[token.type]}
                  >
                    {token.text}
                  </span>
                ))}
                {/* goal 줄 끝에 깜빡이는 커서 */}
                {line.number === codeLines.length - 1 && (
                  <span
                    className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-blink bg-amber-600 dark:bg-blue-400"
                    aria-hidden="true"
                  />
                )}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </article>
  );
}
