---
title: "JVM 메모리 누수 패턴과 해결법"
date: "2026-04-16"
description: "Java 애플리케이션에서 발생하는 7가지 메모리 누수 패턴을 정리합니다. 힙 메모리 누수 4가지와 네이티브 메모리 누수 3가지를 코드 예시와 함께 다루고, 각각의 해결법을 제시합니다."
category: "개발"
subcategory: "Java"
tags: ["guide", "intermediate"]
thumbnail: "/images/thumbnails/java"
series: "java-memory"
seriesOrder: 2
glossary:
  - id: "memory-leak"
    term: "메모리 누수(Memory Leak)"
    brief: "더 이상 사용하지 않는 객체가 회수되지 못하고 메모리를 계속 점유하는 현상"
    detail: "GC가 회수해야 할 객체가 어딘가에서 여전히 참조되고 있어 메모리에 남아있는 상태이다. 시간이 지나면서 메모리 사용량이 점진적으로 증가하고, 결국 OutOfMemoryError를 유발한다."
  - id: "rss"
    term: "RSS(Resident Set Size)"
    brief: "프로세스가 실제로 사용 중인 물리 메모리 크기"
    detail: "운영체제가 측정하는 실제 물리 메모리(RAM) 사용량이다. JVM의 힙뿐 아니라 네이티브 메모리, 스레드 스택, 매핑된 파일 등 프로세스가 사용하는 모든 물리 메모리를 포함한다."
  - id: "try-with-resources"
    term: "try-with-resources"
    brief: "AutoCloseable 리소스를 자동으로 닫아주는 Java 구문"
    detail: "Java 7에서 도입된 구문으로, try 블록이 끝나면 선언된 리소스의 close() 메서드를 자동으로 호출한다. InputStream, Connection 등 반드시 닫아야 하는 리소스의 누수를 방지하는 핵심 패턴이다."
  - id: "direct-bytebuffer"
    term: "Direct ByteBuffer"
    brief: "네이티브 메모리에 할당되는 바이트 버퍼"
    detail: "ByteBuffer.allocateDirect()로 생성하며, 힙이 아닌 네이티브 메모리에 데이터를 저장한다. GC가 직접 관리하지 않고, 힙의 래퍼 객체가 GC될 때 내부 Cleaner가 해제하는 구조이다."
  - id: "ssl-context"
    term: "SslContext"
    brief: "SSL/TLS 연결을 위한 설정과 상태를 관리하는 객체"
    detail: "SSL 인증서, 암호화 알고리즘, 세션 캐시 등 보안 연결에 필요한 정보를 담고 있다. 내부적으로 네이티브 메모리에 SSL 버퍼를 할당하므로, 매번 새로 생성하면 네이티브 메모리 누수의 원인이 된다."
  - id: "thread-pool"
    term: "스레드 풀(Thread Pool)"
    brief: "미리 생성한 스레드를 재사용하는 관리 패턴"
    detail: "ExecutorService로 구현하며, 스레드를 매번 생성/삭제하지 않고 풀에서 꺼내 쓰고 반환하는 방식이다. 스레드 생성 비용과 네이티브 스택 메모리 낭비를 방지한다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-leak-patterns/leak-patterns-overview-light.png" alt="JVM 메모리 누수 패턴과 해결법" />
      <img className="theme-dark" src="/images/posts/jvm-memory-leak-patterns/leak-patterns-overview-dark.png" alt="JVM 메모리 누수 패턴과 해결법" />
    </div>
  </div>
</figure>

[1편](/blog/jvm-memory-structure)에서 JVM이 메모리를 **힙**과 **네이티브**로 나눠 관리한다는 것을 살펴봤습니다.
이번 편에서는 이 두 영역에서 **메모리 누수가 발생하는 구체적인 패턴**과 해결법을 다룹니다.

| 편 | 내용 | 난이도 |
|----|------|--------|
| [1편](/blog/jvm-memory-structure) | JVM 메모리 구조 — 힙과 네이티브 메모리 | 입문 |
| **2편 (현재)** | 메모리 누수 패턴과 해결법 | 중급 |
| 3편 | 메모리 누수 진단과 JVM 튜닝 | 고급 |

---

## 메모리 누수란?

더 이상 사용하지 않는 객체가 **GC에 의해 회수되지 못하고 메모리를 계속 점유**하는 현상입니다.

<div className="info-box">
  <strong>비유: 퇴근했는데 책상 위 서류를 안 치운 것</strong><br/><br/>
  하루 이틀은 괜찮지만, 매일 쌓이면?<br/>
  결국 책상이 꽉 차서 새 작업을 할 수 없게 됩니다.<br/>
  이것이 <code>OutOfMemoryError</code>입니다.
</div>

### 누수 vs 부족

<Term id="memory-leak">메모리 누수</Term>와 메모리 부족은 증상이 비슷하지만 원인과 해결법이 다릅니다.

| 구분 | 메모리 누수 (Leak) | 메모리 부족 (Insufficient) |
|------|-------------------|--------------------------|
| **원인** | 코드 결함으로 GC 불가 | 할당된 메모리 자체가 적음 |
| **증상** | 시간이 지나면서 점진적 증가 | 시작부터 메모리 부족 |
| **해결** | 코드 수정 | `-Xmx` 값 증가 |
| **재시작 시** | 일시적 해소 (다시 증가) | 동일한 문제 반복 |

### 누수 진행 과정

메모리 누수는 한 번에 터지지 않습니다. 서서히 진행되다가 한계에 도달합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-leak-patterns/leak-progression-light.png" alt="메모리 누수 진행 과정" />
      <img className="theme-dark" src="/images/posts/jvm-memory-leak-patterns/leak-progression-dark.png" alt="메모리 누수 진행 과정" />
    </div>
  </div>
  <figcaption>메모리 누수 진행 과정: 정상 → 누수 → GC 빈번 → OOM 크래시</figcaption>
</figure>

가장 까다로운 점은 **초기에는 아무 증상이 없다**는 것입니다.
배포 직후에는 정상이다가 며칠, 몇 주 뒤에야 장애로 나타나기 때문에 원인을 찾기 어렵습니다.

---

## 힙 메모리 누수 패턴

힙 메모리 누수의 핵심 원인은 하나입니다.
**사용이 끝난 객체에 대한 참조가 어딘가에 남아있어 GC가 회수하지 못하는 것**입니다.

### 패턴 1: 컬렉션에 넣고 빼지 않기

가장 흔한 누수 패턴입니다.

```java
// ❌ 누수: static Map에 계속 추가만 함
public class CacheManager {
    private static final Map<String, Object> cache = new HashMap<>();

    public void addToCache(String key, Object value) {
        cache.put(key, value);  // 계속 쌓임
        // remove()를 호출하지 않으면 → 메모리 누수
    }
}
```

`static` 필드에 담긴 컬렉션은 애플리케이션이 살아있는 동안 절대 GC되지 않습니다.
여기에 데이터를 넣기만 하고 빼지 않으면, 시간이 지날수록 메모리 사용량이 증가합니다.

```java
// ✅ 해결: 크기 제한이 있는 캐시 사용
public class CacheManager {
    private static final Map<String, Object> cache = new LinkedHashMap<>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry eldest) {
            return size() > 100;  // 100개 초과 시 가장 오래된 항목 자동 제거
        }
    };
}
```

실무에서는 `Caffeine`이나 `Guava Cache`처럼 만료 정책과 최대 크기를 지원하는 캐시 라이브러리를 사용하는 것이 더 안전합니다.

### 패턴 2: 리스너/콜백 등록 후 해제 안 함

이벤트 리스너를 등록하면, 이벤트 버스가 리스너 객체에 대한 **강한 참조**를 유지합니다.
객체가 더 이상 필요 없어도 등록을 해제하지 않으면 GC가 회수할 수 없습니다.

```java
// ❌ 누수: 이벤트 리스너 등록 후 해제하지 않음
public class DataProcessor {
    public void init() {
        EventBus.register(this);  // 등록
        // 객체가 더 이상 필요 없어도 EventBus가 참조를 유지
        // → GC 불가 → 메모리 누수
    }
}
```

```java
// ✅ 해결: 사용 후 반드시 해제
public class DataProcessor implements AutoCloseable {
    public void init() {
        EventBus.register(this);
    }

    @Override
    public void close() {
        EventBus.unregister(this);  // 반드시 해제
    }
}
```

Spring의 `@EventListener`는 빈 생명주기에 맞춰 자동 관리되므로 이 문제가 덜합니다.
하지만 직접 `addListener()` 류의 API를 사용하는 경우에는 반드시 해제 로직이 필요합니다.

### 패턴 3: 닫지 않은 리소스

`InputStream`, `Connection`, `PreparedStatement` 등은 사용 후 반드시 닫아야 합니다.
닫지 않으면 내부 버퍼와 OS 핸들이 해제되지 않아 누수가 발생합니다.

```java
// ❌ 누수: 예외 발생 시 close()가 호출되지 않음
public String readFile(String path) throws IOException {
    FileInputStream fis = new FileInputStream(path);
    byte[] data = fis.readAllBytes();  // ← 여기서 예외 발생하면?
    fis.close();                        // ← 이 줄은 실행되지 않음
    return new String(data);
}
```

```java
// ✅ 해결: try-with-resources 사용
public String readFile(String path) throws IOException {
    try (FileInputStream fis = new FileInputStream(path)) {
        return new String(fis.readAllBytes());
        // try 블록 종료 시 자동으로 close() 호출
        // 예외가 발생해도 반드시 닫힘
    }
}
```

<div className="warning-box">
  <strong>try-with-resources는 선택이 아닌 필수</strong><br/><br/>
  <code>AutoCloseable</code>을 구현하는 모든 리소스는 <Term id="try-with-resources">try-with-resources</Term>로 사용해야 합니다.<br/>
  직접 <code>close()</code>를 호출하는 방식은 예외 상황에서 누수를 유발합니다.
</div>

### 패턴 4: 내부 클래스의 외부 참조

Java의 **비정적 내부 클래스**는 외부 클래스의 인스턴스를 암묵적으로 참조합니다.
이 때문에 내부 클래스 객체가 살아있는 한, 외부 클래스(와 그 필드들)도 GC되지 않습니다.

```java
// ❌ 누수: 익명 클래스가 Server 인스턴스 전체를 참조
public class Server {
    private byte[] largeData = new byte[10_000_000]; // 10MB

    public Runnable createTask() {
        return new Runnable() {
            @Override
            public void run() {
                System.out.println("작업 실행");
                // largeData를 사용하지 않지만, Server 인스턴스 전체를 참조
            }
        };
    }
}
```

`Runnable` 익명 클래스가 `Server`를 참조하므로, `Runnable`이 스레드 풀 등에 남아있는 한 10MB의 `largeData`도 회수되지 않습니다.

```java
// ✅ 해결: 람다 또는 static 내부 클래스 사용
public class Server {
    private byte[] largeData = new byte[10_000_000];

    public Runnable createTask() {
        return () -> System.out.println("작업 실행");
        // 람다는 캡처하는 변수만 참조 → Server 인스턴스 참조 없음
    }
}
```

<div className="info-box">
  <strong>람다 vs 익명 클래스의 참조 차이</strong><br/><br/>
  <strong>익명 클래스</strong>: 항상 외부 클래스 인스턴스에 대한 참조를 가집니다.<br/>
  <strong>람다</strong>: 실제로 사용하는 변수만 캡처합니다. 외부 필드를 사용하지 않으면 참조하지 않습니다.<br/><br/>
  따라서 외부 클래스의 필드를 사용하지 않는 콜백/태스크는 람다로 작성하는 것이 안전합니다.
</div>

---

## 네이티브 메모리 누수 패턴

네이티브 메모리 누수는 힙 누수보다 **진단이 훨씬 어렵습니다.**
힙 덤프에 나타나지 않고, OS 레벨의 <Term id="rss">RSS</Term>만 계속 증가하기 때문입니다.

### 패턴 5: HttpClient/SslContext를 매번 생성

1편에서 언급했던 WebClient 장애의 직접적인 원인입니다.
실무에서 가장 흔하게 만나는 네이티브 메모리 누수 패턴이기도 합니다.

```java
// ❌ 누수: 매 요청마다 새 HttpClient + SslContext 생성
@Service
public class ApiService {

    public String callExternalApi(String url) {
        // 매번 새로 생성 → SSL 핸드셰이크마다 네이티브 버퍼 할당
        SslContext sslContext = SslContextBuilder.forClient()
            .trustManager(InsecureTrustManagerFactory.INSTANCE)
            .build();

        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(sslContext));

        WebClient client = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();

        return client.get().uri(url)
            .retrieve().bodyToMono(String.class).block();
    }
}
```

이 코드가 위험한 이유는 아래 흐름에서 확인할 수 있습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-leak-patterns/webclient-leak-light.png" alt="HttpClient/SslContext 반복 생성으로 인한 네이티브 메모리 누수 흐름" />
      <img className="theme-dark" src="/images/posts/jvm-memory-leak-patterns/webclient-leak-dark.png" alt="HttpClient/SslContext 반복 생성으로 인한 네이티브 메모리 누수 흐름" />
    </div>
  </div>
  <figcaption>HttpClient/SslContext 반복 생성으로 인한 네이티브 메모리 누수 흐름</figcaption>
</figure>

<Term id="ssl-context">SslContext</Term>와 `HttpClient`는 생성할 때마다 네이티브 메모리에 SSL 버퍼와 커넥션 풀을 할당합니다.
힙에는 작은 래퍼 객체만 남기 때문에 힙 모니터링으로는 문제를 발견할 수 없습니다.
래퍼 객체가 Old Generation으로 승격되면, Full GC가 발생할 때까지 네이티브 메모리가 해제되지 않습니다.

```java
// ✅ 해결: 싱글톤으로 한 번만 생성하여 재사용
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() throws SSLException {
        SslContext sslContext = SslContextBuilder.forClient()
            .trustManager(InsecureTrustManagerFactory.INSTANCE)
            .build();

        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(sslContext))
            .responseTimeout(Duration.ofSeconds(5));

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class ApiService {
    private final WebClient webClient;  // 주입받아 재사용

    public String callExternalApi(String url) {
        return webClient.get().uri(url)
            .retrieve().bodyToMono(String.class).block();
    }
}
```

<div className="warning-box">
  <strong>Spring Bean으로 등록 = 싱글톤</strong><br/><br/>
  <code>@Bean</code>으로 등록하면 Spring이 하나의 인스턴스만 생성하고 재사용합니다.<br/>
  <code>WebClient</code>, <code>RestTemplate</code>, <code>ObjectMapper</code> 등 무거운 객체는 반드시 Bean으로 등록하여 재사용해야 합니다.
</div>

### 패턴 6: Direct ByteBuffer 과다 할당

<Term id="direct-bytebuffer">Direct ByteBuffer</Term>는 네이티브 메모리에 할당됩니다.
대량으로 생성하면서 재사용하지 않으면 네이티브 메모리가 고갈됩니다.

```java
// ❌ 누수: 루프 안에서 Direct 버퍼를 대량 생성
public void processData() {
    for (int i = 0; i < 100_000; i++) {
        ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024); // 1MB
        // 사용 후 명시적 해제 없음
        // GC가 래퍼 객체를 수거할 때까지 네이티브 메모리 점유
    }
}
```

```java
// ✅ 해결: 버퍼를 한 번 할당하고 재사용
public void processData() {
    ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024); // 1MB
    for (int i = 0; i < 100_000; i++) {
        buffer.clear();  // 위치만 초기화, 메모리 재할당 없음
        // 데이터 처리
    }
}
```

`clear()`는 버퍼 내용을 지우는 것이 아니라 **읽기/쓰기 위치를 초기화**하는 것입니다.
같은 네이티브 메모리 영역을 반복 사용하므로 추가 할당이 발생하지 않습니다.

### 패턴 7: 스레드 누수

스레드 하나당 기본 **1MB의 네이티브 스택 메모리**를 사용합니다.
스레드를 생성만 하고 종료하지 않으면, 스레드 수만큼 네이티브 메모리가 쌓입니다.

```java
// ❌ 누수: 요청마다 스레드 생성, 종료 없음
public void handleRequest() {
    new Thread(() -> {
        while (true) {  // 영원히 실행
            // 작업
        }
    }).start();  // 요청마다 스레드 생성 → 무한 증가
}
```

```java
// ✅ 해결: 스레드 풀 사용
private final ExecutorService executor = Executors.newFixedThreadPool(10);

public void handleRequest() {
    executor.submit(() -> {
        // 작업 완료 후 스레드가 풀로 반환됨
    });
}
```

<Term id="thread-pool">스레드 풀</Term>은 미리 정해진 수의 스레드를 생성해두고 재사용합니다.
작업이 끝나면 스레드가 소멸하지 않고 풀로 돌아가므로, 스레드 수가 무한히 증가하는 것을 방지합니다.

<div className="info-box">
  <strong>스레드 수 확인 방법</strong><br/><br/>
  <code>jcmd &lt;PID&gt; Thread.print</code>으로 현재 활성 스레드 목록을 확인할 수 있습니다.<br/>
  시간이 지나면서 스레드 수가 계속 증가한다면 스레드 누수를 의심해야 합니다.
</div>

---

## 실무 체크리스트

### 코드 작성 시

- `HttpClient`, `WebClient`, `SslContext`는 싱글톤으로 재사용하고 있는가?
- `InputStream`, `Connection` 등 리소스는 `try-with-resources`로 닫고 있는가?
- `static` 컬렉션에 데이터를 넣으면 크기 제한이 있는가?
- 이벤트 리스너/콜백은 등록 해제(`unregister`) 로직이 있는가?
- 스레드를 직접 생성하지 않고 스레드 풀을 사용하고 있는가?
- 익명 클래스 대신 람다를 사용하고 있는가?

### 코드 리뷰 시

| 발견 패턴 | 위험도 | 확인 포인트 |
|----------|--------|------------|
| 메서드 안에서 `new HttpClient()` | **높음** | 싱글톤 재사용 여부 |
| `static Map`에 `put`만 있고 `remove` 없음 | **높음** | 크기 제한 정책 |
| `new FileInputStream()` without try-with-resources | **중간** | 리소스 해제 보장 |
| `new Thread().start()` | **중간** | 스레드 풀 사용 여부 |
| 익명 클래스에서 외부 필드 미사용 | **낮음** | 람다 전환 가능 여부 |

---

## 정리

| 영역 | 패턴 | 핵심 원인 | 해결법 |
|------|------|----------|--------|
| **힙** | 컬렉션 미정리 | `static` 컬렉션에 무한 추가 | 크기 제한 캐시 사용 |
| **힙** | 리스너 미해제 | 등록만 하고 해제 안 함 | `close()`에서 `unregister()` |
| **힙** | 리소스 미닫음 | `close()` 호출 누락 | `try-with-resources` |
| **힙** | 내부 클래스 참조 | 익명 클래스의 암묵적 외부 참조 | 람다 사용 |
| **네이티브** | HttpClient 반복 생성 | 매 요청마다 새 인스턴스 | 싱글톤 Bean 재사용 |
| **네이티브** | Direct Buffer 과다 | 버퍼 생성만 하고 재사용 안 함 | `clear()` 후 재사용 |
| **네이티브** | 스레드 누수 | 스레드 직접 생성, 미종료 | `ExecutorService` 사용 |

메모리 누수를 방지하는 핵심 원칙은 두 가지입니다.

1. **힙 메모리**: 사용이 끝난 객체의 참조를 끊을 것
2. **네이티브 메모리**: 무거운 자원은 한 번 생성해서 재사용할 것

다음 편에서는 **메모리 누수가 발생했을 때 진단하는 방법**과 JVM 튜닝 옵션을 다룹니다.
`jstat`, `jmap`, 힙 덤프 분석, NMT(Native Memory Tracking) 등 실무 도구를 직접 사용해봅니다.
