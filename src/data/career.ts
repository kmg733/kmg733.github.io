import type { Company } from "@/types";

/**
 * 경력 데이터 (최신 소속이 먼저 오도록 정렬)
 *
 * 소속을 추가하려면 `careers` 배열에 새 Company를 추가하세요.
 * 항목을 추가하려면 각 소속의 `items` 배열에 CareerItem을 추가하세요.
 * - date 형식: "YYYY.MM" (정렬·표기 기준)
 * - highlight: 대표 성과 강조(⭐)
 * - repoUrl: GitHub 등 외부 링크
 * - postSlug: 향후 블로그 글 연결용
 */
const jirandata: Company = {
  name: "지란지교데이터",
  role: "백엔드 ~ 프론트엔드 풀스택 개발",
  period: "2022.06 ~ 재직 중",
  description:
    "개인정보 검출·비식별 조치 솔루션의 백엔드(API·쿼리·보안)부터 프론트엔드(UI·성능)까지 풀스택으로 개발했습니다. 대용량 데이터 처리 성능 개선, 인증·인가 보안 기반 구축, 트랜잭션·동시성 정합성 설계, 품질·인프라 개선을 담당했습니다.",
  items: [
    // ── 성능 ──────────────────────────────────────────────
    {
      id: "perf-cursor-stream",
      title: "MyBatis Cursor 스트리밍으로 대용량 처리 OOM 해결",
      summary:
        "전건 메모리 적재를 Cursor 스트리밍 + 제네릭 헬퍼로 전환, 처리 메모리 2.5GB → 500MB (80% 절감)",
      category: "성능",
      date: "2025.09",
      period: "2025.06 ~ 2025.09",
      highlight: true,
    },
    {
      id: "perf-render-21x",
      title: "설정 화면 렌더링 21배 개선",
      summary:
        "polling + 무조건 리로드 안티패턴을 재귀 + diff 갱신으로 전환, LCP 7.93s → 0.38s (21배)",
      category: "성능",
      date: "2025.03",
      highlight: true,
    },
    {
      id: "perf-excel-stream",
      title: "대용량 Excel 업로드/다운로드 스트리밍 전환",
      summary:
        "SAX 스트리밍 읽기 + SXSSF 쓰기로 메모리 안정화, ZIP Bomb·리소스 누수 방어 적용",
      category: "성능",
      date: "2025.10",
      period: "2025.10 ~ 2025.12",
    },
    {
      id: "perf-n1-async",
      title: "N+1 동기 호출을 단일 비동기 API로 전환",
      summary:
        "재귀적 N+1 동기 호출을 백·프론트 양쪽에서 단일 비동기 호출로 통합, UI 블로킹 해소",
      category: "성능",
      date: "2026.03",
    },
    {
      id: "perf-detail-33",
      title: "상세 조회 속도 33% 단축",
      summary: "무거운 SQL 연산을 Java 레이어로 이전, 15,452ms → 10,286ms (33% 단축)",
      category: "성능",
      date: "2025.07",
    },
    {
      id: "perf-engine-assign",
      title: "진단 엔진 배정 알고리즘 개선",
      summary:
        '"가용 최대" 방식을 "부하 최소" 휴리스틱으로 변경해 엔진 간 작업 쏠림 완화',
      category: "성능",
      date: "2024.11",
    },

    // ── 보안 ──────────────────────────────────────────────
    {
      id: "sec-spring-security",
      title: "Spring Security 6 인증·인가 아키텍처 from scratch 구축",
      summary:
        "필터 체인·커스텀 AuthenticationProvider·핸들러를 직접 구성해 통합 시스템의 인증·인가 골격 구축",
      category: "보안",
      date: "2024.03",
    },
    {
      id: "sec-web-vuln",
      title: "OWASP 웹 취약점 조치 (SQLi·CSP·권한우회)",
      summary:
        "MyBatis `${}` → `#{}` 치환, CSP 인라인 분리, 동적 권한 체크 등 웹 취약점 다발 조치",
      category: "보안",
      date: "2025.08",
      period: "2025.08 ~ 2026.06",
    },
    {
      id: "sec-otp-2fa",
      title: "OTP 2FA · IP 접속 제한 인증 강화",
      summary: "Spring Security 확장점을 활용한 TOTP 기반 2단계 인증과 IP 화이트리스트 제한 적용",
      category: "보안",
      date: "2024.04",
      period: "2024.03 ~ 2024.04",
    },
    {
      id: "sec-bruteforce",
      title: "로그인 무차별 대입(Brute-force) 방어",
      summary: "실패 횟수 기반 차단으로 무차별 대입 공격 방어",
      category: "보안",
      date: "2024.03",
    },

    // ── 아키텍처 ──────────────────────────────────────────
    {
      id: "arch-tx-isolation",
      title: "트랜잭션 격리로 Silent Rollback 방지",
      summary:
        "부가 작업 실패가 주 트랜잭션을 조용히 롤백시키던 문제를 REQUIRES_NEW로 격리, 책임 분리",
      category: "아키텍처",
      date: "2026.04",
    },
    {
      id: "arch-race-condition",
      title: "승인자 조회 Race Condition 구조적 해소",
      summary: "두 번 조회로 발생하던 race drift를 단일 쿼리 통합으로 구조에서 제거",
      category: "아키텍처",
      date: "2026.04",
    },

    // ── 인프라 ────────────────────────────────────────────
    {
      id: "infra-i18n",
      title: "한/영 i18n 다국어 인프라 구축",
      summary:
        "SSR/CSR 동시 지원, localStorage 캐싱, cold start 시 키 노출 문제 해결까지 i18n 기반 구축",
      category: "인프라",
      date: "2026.03",
      period: "2026.01 ~ 2026.03",
      highlight: true,
    },
    {
      id: "infra-testcontainers",
      title: "Testcontainers 기반 통합 테스트 인프라",
      summary:
        "실제 PostgreSQL 컨테이너로 동적 SQL·JSONB·타입 변환 등 Mock으로 불가능한 SQL 검증",
      category: "인프라",
      date: "2026.05",
      highlight: true,
    },
    {
      id: "infra-springboot-upgrade",
      title: "Spring Boot 단계 업그레이드 (3.2 → 3.5)",
      summary: "단계적 업그레이드 + matcher 마이그레이션으로 Tomcat 취약점 해소",
      category: "인프라",
      date: "2025.11",
    },
  ],
};

const nsl: Company = {
  name: "공주대학교 네트워크보안연구실 (Network Security Lab)",
  role: "학부 연구생",
  period: "2019.06 ~ 2022.02",
  description:
    "학부 연구생으로 IoT·블록체인·임베디드 기반의 보안 프로젝트를 수행했습니다.",
  items: [
    {
      id: "nsl-bot",
      title: "블록체인을 이용한 IoT 보안 기능 고도화",
      summary: "블록체인을 활용해 IoT 환경의 보안 기능을 고도화한 프로젝트",
      category: "프로젝트",
      date: "2021.05",
      period: "2021.05 ~ 2021.10",
      repoUrl: "https://github.com/kmg733/BoT",
    },
    {
      id: "nsl-imcp",
      title: "지능형 미아방지 시스템",
      summary: "IoT 기반으로 미아 발생을 예방·탐지하는 지능형 시스템",
      category: "프로젝트",
      date: "2020.05",
      period: "2020.05 ~ 2020.10",
      repoUrl: "https://github.com/kmg733/IMCP",
    },
    {
      id: "nsl-lab-iot",
      title: "IoT를 이용한 연구실 자동화 시스템",
      summary: "IoT 디바이스로 연구실 환경을 모니터링·제어하는 자동화 시스템",
      category: "프로젝트",
      date: "2019.11",
      period: "2019.11 ~ 2020.03",
      repoUrl: "https://github.com/kmg733/lab_iot",
    },
  ],
};

/** 최신 소속이 먼저 (페이지 렌더 순서) */
export const careers: Company[] = [jirandata, nsl];
