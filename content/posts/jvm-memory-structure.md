---
title: "JVM 메모리 구조 - 힙과 네이티브 메모리"
date: "2026-04-06"
description: "JVM이 메모리를 관리하는 방식을 정리합니다. 힙 메모리와 네이티브 메모리의 차이, 객체의 생애주기, 가비지 컬렉션의 동작 원리를 초보자 눈높이에서 다룹니다."
category: "개발"
subcategory: "Java"
tags: ["guide", "beginner"]
thumbnail: "/images/thumbnails/java"
series: "java-memory"
seriesOrder: 1
glossary:
  - id: "heap-memory"
    term: "힙 메모리(Heap Memory)"
    brief: "JVM이 관리하는 Java 객체 저장 공간"
    detail: "new 키워드로 생성하는 모든 Java 객체가 저장되는 메모리 영역이다. JVM의 가비지 컬렉터가 자동으로 관리하며, -Xmx 옵션으로 최대 크기를 설정한다."
  - id: "native-memory"
    term: "네이티브 메모리(Native Memory)"
    brief: "OS에서 직접 할당받는 JVM 외부 메모리 영역"
    detail: "Off-Heap 메모리라고도 한다. GC가 관리하지 않으며, Metaspace, Direct ByteBuffer, 스레드 스택, JNI 라이브러리 등이 이 영역을 사용한다. 사용 후 명시적으로 해제해야 한다."
  - id: "garbage-collection"
    term: "가비지 컬렉션(Garbage Collection)"
    brief: "더 이상 참조되지 않는 객체를 자동으로 회수하는 메커니즘"
    detail: "JVM이 힙 메모리에서 더 이상 사용하지 않는 객체를 찾아 자동으로 메모리를 회수하는 과정이다. Minor GC(Young 영역), Major GC(Old 영역), Full GC(전체 힙) 세 가지 종류가 있다."
  - id: "young-generation"
    term: "Young Generation"
    brief: "새로 생성된 객체가 저장되는 힙 영역"
    detail: "Eden, Survivor 0, Survivor 1 세 영역으로 구성된다. 대부분의 객체는 이 영역에서 생성되고, 금방 사용이 끝나 Minor GC에 의해 회수된다. GC가 빠르고 자주 발생한다."
  - id: "old-generation"
    term: "Old Generation"
    brief: "여러 번 GC에서 살아남은 객체가 저장되는 힙 영역"
    detail: "Young Generation에서 여러 차례 Minor GC를 거치고도 살아남은 객체가 승격(Promotion)되는 영역이다. 캐시, 싱글톤, 커넥션 풀 등 오래 사용되는 객체가 저장된다."
  - id: "stop-the-world"
    term: "Stop-The-World"
    brief: "GC 실행 중 애플리케이션이 일시 정지되는 현상"
    detail: "가비지 컬렉터가 동작하는 동안 애플리케이션의 모든 스레드가 멈추는 현상이다. Full GC에서 특히 길게 발생하며, 이 시간이 길어지면 사용자 요청 지연이나 타임아웃의 원인이 된다."
  - id: "metaspace"
    term: "Metaspace"
    brief: "클래스 메타데이터를 저장하는 네이티브 메모리 영역"
    detail: "Java 8부터 PermGen을 대체한 영역으로, 클래스 이름, 메서드 정보, 상수 풀 등 클래스의 구조 정보를 저장한다. 네이티브 메모리에 위치하며 -XX:MaxMetaspaceSize로 최대 크기를 제한할 수 있다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-structure/jvm-memory-light.png" alt="JVM 메모리 구조" />
      <img className="theme-dark" src="/images/posts/jvm-memory-structure/jvm-memory-dark.png" alt="JVM 메모리 구조" />
    </div>
  </div>
</figure>

Java 개발을 하다 보면 `OutOfMemoryError`를 한 번쯤 만나게 됩니다.
이 에러를 만났을 때 "메모리를 늘려야 하나?", "코드에 문제가 있나?"를 판단하려면 JVM이 메모리를 어떻게 관리하는지 알아야 합니다.

이 글을 쓰게 된 계기도 실무에서 만난 두 번의 메모리 장애였습니다.

첫 번째는 **엑셀 파일 업로드/다운로드** 기능에서 발생한 `OutOfMemoryError`였습니다.
수천 행의 엑셀 데이터를 한 번에 메모리에 올리다 보니 힙 메모리가 한계에 도달했고, 서버가 응답을 멈췄습니다.
전형적인 **힙 메모리 문제**였습니다.

두 번째는 더 찾기 어려운 문제였습니다.
외부 API를 호출하는 `WebClient`에서 **매 요청마다 새로운 커넥션 풀과 SSL 컨텍스트를 생성**하고 있었습니다.
힙 사용량은 정상이었지만, 서버의 실제 메모리(RES)는 계속 증가하다가 결국 OS가 프로세스를 강제 종료했습니다.
**네이티브 메모리 누수**였습니다.

두 문제 모두 JVM의 메모리 구조를 이해했다면 더 빠르게 원인을 찾을 수 있었을 것입니다.
이 글은 **Java 메모리 시리즈 3편** 중 첫 번째로, JVM의 메모리 구조를 초보자 눈높이에서 다룹니다.

| 편 | 내용 | 난이도 |
|----|------|--------|
| **1편 (현재)** | JVM 메모리 구조 — 힙과 네이티브 메모리 | 입문 |
| [2편](/blog/jvm-memory-leak-patterns) | 메모리 누수 패턴과 해결법 | 중급 |
| [3편](/blog/jvm-memory-diagnosis-tuning) | 메모리 누수 진단과 JVM 튜닝 | 고급 |

---

## 메모리란 무엇인가

프로그램이 실행되려면 데이터를 **어딘가에 저장**해야 합니다. 그 "어딘가"가 바로 **메모리(RAM)**입니다.

<div className="info-box">
  <strong>비유: 메모리 = 책상</strong><br/><br/>
  책상이 넓으면 여러 작업을 동시에 할 수 있습니다.<br/>
  책상이 좁으면 작업물을 치우면서 해야 합니다.<br/>
  책상이 꽉 차면 더 이상 작업할 수 없습니다. 이것이 <code>OutOfMemoryError</code>입니다.
</div>

Java 프로그램도 마찬가지입니다.
객체를 생성하고, 데이터를 처리하고, 네트워크 통신을 하려면 메모리가 필요합니다.
Java는 이 메모리를 크게 **두 가지 영역**으로 나눠서 사용합니다.

---

## JVM 메모리 구조 전체 그림

운영체제(OS)가 JVM 프로세스에 메모리를 할당하면, JVM은 그 메모리를 용도에 따라 나눠서 관리합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-structure/jvm-structure-light.png" alt="JVM 메모리 구조 전체 그림" />
      <img className="theme-dark" src="/images/posts/jvm-memory-structure/jvm-structure-dark.png" alt="JVM 메모리 구조 전체 그림" />
    </div>
  </div>
  <figcaption>JVM 메모리 구조 전체 그림</figcaption>
</figure>

크게 두 영역으로 나뉩니다. <Term id="heap-memory">힙 메모리</Term>와 <Term id="native-memory">네이티브 메모리</Term>입니다.

| 구분 | 힙 메모리 (Heap) | 네이티브 메모리 (Off-Heap) |
|------|-----------------|--------------------------|
| **관리 주체** | JVM의 GC가 자동 회수 | 개발자/라이브러리가 직접 해제 |
| **할당 방법** | `new Object()` | `ByteBuffer.allocateDirect()` |
| **크기 설정** | `-Xmx` (최대), `-Xms` (초기) | `-XX:MaxDirectMemorySize` |
| **GC 대상** | O (자동 수거) | X (수동 해제 필요) |
| **속도** | 할당 빠름, GC 오버헤드 있음 | 할당 느림, I/O 시 빠름 |
| **누수 시 증상** | `OutOfMemoryError: Java heap space` | RSS 증가, OS OOM Killer |
| **저장 대상** | Java 객체 (String, List, DTO 등) | 바이트 버퍼, SSL 컨텍스트, 클래스 메타데이터 |

---

## 힙 메모리 상세

### 힙 메모리란?

`new` 키워드로 생성하는 **모든 Java 객체**가 저장되는 공간입니다.
JVM이 자동으로 관리하며, 더 이상 사용하지 않는 객체는 <Term id="garbage-collection">가비지 컬렉터(GC)</Term>가 회수합니다.

```java
// 이 객체들은 모두 힙 메모리에 저장됩니다
String name = new String("서버");       // 힙에 String 객체 생성
List<String> list = new ArrayList<>();  // 힙에 ArrayList 객체 생성
ServerDTO dto = new ServerDTO();        // 힙에 DTO 객체 생성
```

앞서 언급한 엑셀 파일 처리 중 발생한 OOM도 이 힙 영역의 문제였습니다.
수천 행의 데이터를 `List<Row>`로 한 번에 읽어들이면서 힙이 가득 찬 것입니다.

### 세대별 구조

JVM은 힙을 **세대(Generation)**로 나눕니다.
"대부분의 객체는 금방 사라진다"는 관찰에 기반한 설계입니다.

<div className="info-box">
  <strong>약한 세대 가설 (Weak Generational Hypothesis)</strong><br/><br/>
  "대부분의 객체는 생성 직후 빠르게 사용되고 버려진다"<br/><br/>
  예를 들어:<br/>
  - 요청 처리 중 생성된 임시 DTO → 응답 보내면 불필요<br/>
  - for 루프 안의 임시 String → 루프 끝나면 불필요<br/>
  - Stream 중간 연산 객체 → 최종 결과만 있으면 불필요
</div>

이 가설에 따라, JVM은 "새로 만들어진 객체"와 "오래 살아남은 객체"를 분리해서 관리합니다.

| 영역 | 설명 | 특징 |
|------|------|------|
| **Eden** | 객체가 처음 생성되는 곳 | `new Object()` 호출 시 여기에 저장 |
| **Survivor 0, 1** | Minor GC에서 살아남은 객체가 이동하는 곳 | 두 영역을 번갈아 사용 |
| **Old Generation** | 여러 번 GC에서 살아남은 객체 | 캐시, 싱글톤, 커넥션 풀 등 |

### 객체의 생애주기

Java 객체가 생성부터 소멸까지 거치는 과정을 단계별로 살펴보겠습니다.

**1단계: 객체 탄생 (Eden)**

```java
ServerDTO dto = new ServerDTO();  // Eden 영역에 생성됩니다
```

모든 새 객체는 <Term id="young-generation">Young Generation</Term>의 Eden 영역에 저장됩니다.

**2단계: Minor GC 발생 — 살아남은 객체만 이동**

Eden 영역이 가득 차면 **Minor GC**가 발생합니다.
이때 참조가 남아있는 객체만 Survivor 영역으로 이동하고, 참조가 없는 객체는 삭제됩니다.

```java
// Minor GC 시점의 판단
ServerDTO dto = new ServerDTO();  // ← 변수가 참조 중 → 생존
new ServerDTO();                   // ← 아무도 참조하지 않음 → 삭제
```

살아남은 객체는 Survivor 영역으로 옮겨지면서 **나이(age)**가 1 증가합니다.

**3단계: GC를 반복하며 살아남기**

Minor GC가 반복될 때마다, 살아남은 객체는 Survivor 0 → Survivor 1 → Survivor 0... 을 오가며 나이가 계속 증가합니다.

**4단계: Old Generation으로 승격**

나이가 임계값(기본 15)에 도달하면 <Term id="old-generation">Old Generation</Term>으로 승격됩니다.
캐시 데이터, 싱글톤 빈, 커넥션 풀 등 오래 사용되는 객체들이 여기에 위치합니다.

**5단계: Major GC 또는 Full GC**

Old 영역이 가득 차면 **Major GC**가 발생합니다.
전체 힙을 스캔하는 **Full GC**는 가장 오래 걸리며, 이때 <Term id="stop-the-world">Stop-The-World</Term>가 발생합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/jvm-memory-structure/gc-lifecycle-light.png" alt="객체의 생애주기: Eden → Survivor → Old → GC" />
      <img className="theme-dark" src="/images/posts/jvm-memory-structure/gc-lifecycle-dark.png" alt="객체의 생애주기: Eden → Survivor → Old → GC" />
    </div>
  </div>
  <figcaption>객체의 생애주기: Eden → Survivor → Old → GC</figcaption>
</figure>

### GC 종류 비교

| GC 종류 | 대상 영역 | 발생 조건 | 소요 시간 | 빈도 |
|---------|----------|----------|----------|------|
| **Minor GC** | Young Generation | Eden이 가득 찰 때 | 짧음 (ms 단위) | 자주 |
| **Major GC** | Old Generation | Old가 가득 찰 때 | 길음 (ms~초 단위) | 가끔 |
| **Full GC** | 전체 힙 + Metaspace | 메모리 부족 시 | 매우 길음 | 드물게 |

<div className="warning-box">
  <strong>Full GC가 자주 발생하면 문제입니다</strong><br/><br/>
  전체 힙을 스캔하는 동안 애플리케이션이 <strong>일시 정지(Stop-The-World)</strong>됩니다.
  이 시간이 길어지면 사용자 요청이 지연되거나 타임아웃이 발생합니다.<br/><br/>
  Full GC가 반복되는 것은 대부분 <strong>메모리 누수</strong>의 신호입니다.
  이 내용은 시리즈 2편에서 자세히 다룹니다.
</div>

### 힙 메모리 설정

JVM 실행 시 옵션으로 힙 크기를 지정할 수 있습니다.

```bash
java -Xms512m   # 초기 힙 크기 (시작할 때 확보)
     -Xmx2g     # 최대 힙 크기 (이 이상 사용 불가)
     -jar app.jar
```

| 옵션 | 설명 | 예시 |
|------|------|------|
| `-Xms` | 초기 힙 크기 | `-Xms512m` (512MB) |
| `-Xmx` | 최대 힙 크기 | `-Xmx2g` (2GB) |
| `-XX:NewRatio` | Old:Young 비율 | `-XX:NewRatio=2` → Old 2 : Young 1 |
| `-XX:SurvivorRatio` | Eden:Survivor 비율 | `-XX:SurvivorRatio=8` → Eden 8 : Survivor 1 |

<div className="info-box">
  <strong>운영 환경 팁: -Xms와 -Xmx를 같은 값으로 설정</strong><br/><br/>
  힙 크기가 늘어나고 줄어드는(resize) 과정 자체가 오버헤드입니다.<br/>
  운영 환경에서는 <code>-Xms2g -Xmx2g</code>처럼 같은 값으로 설정하여 크기 조정을 방지하는 것이 좋습니다.
</div>

---

## 네이티브 메모리 상세

### 네이티브 메모리란?

JVM이 아닌 **운영체제(OS)에서 직접 할당**받는 메모리 영역입니다.
GC가 관리하지 않으므로, 사용 후 반드시 명시적으로 해제해야 합니다.

### 왜 네이티브 메모리를 사용하는가?

네트워크 통신을 예로 들어보겠습니다.

**힙 버퍼를 사용하면** 데이터를 보내기 위해 힙에서 임시 Direct 버퍼로 복사하고, 다시 OS 커널로 전달해야 합니다. 총 **2회 복사**가 발생합니다.

**Direct 버퍼를 사용하면** 네이티브 메모리에서 바로 OS 커널로 전달됩니다. **1회 복사**로 끝납니다.

| 방식 | 경로 | 복사 횟수 | 성능 |
|------|------|----------|------|
| 힙 버퍼 | 힙 → 임시 Direct 버퍼 → OS 커널 | 2회 | 느림 |
| Direct 버퍼 | Direct 버퍼 → OS 커널 | 1회 | 빠름 |

네트워크 I/O, 파일 I/O처럼 **대량의 바이트를 처리**하는 작업에서 이 차이가 큽니다.

앞서 언급한 WebClient 문제도 이 영역에서 발생했습니다.
매 요청마다 새로운 `HttpClient`와 `SslContext`를 생성하면, 그때마다 네이티브 메모리에 SSL 버퍼와 커넥션 풀이 할당됩니다.
힙에서는 래퍼 객체만 보이기 때문에 힙 모니터링만으로는 문제를 발견할 수 없었고, OS의 RSS(실제 메모리 사용량)가 계속 늘어나는 것을 보고서야 원인을 추적할 수 있었습니다.

### 네이티브 메모리를 사용하는 대표 사례

| 사례 | 설명 | 해당 클래스/라이브러리 |
|------|------|----------------------|
| **SSL/TLS** | 암호화/복호화 바이트 버퍼 | `SslContext`, `SSLEngine` |
| **HTTP 클라이언트** | 네트워크 I/O 버퍼 | Netty `ByteBuf`, `HttpClient` |
| **NIO 채널** | 파일/소켓 I/O | `ByteBuffer.allocateDirect()` |
| **<Term id="metaspace">Metaspace</Term>** | 클래스 메타데이터 저장 | JVM 내부 |
| **스레드 스택** | 스레드별 호출 스택 | `Thread`, `-Xss` 설정 |
| **JNI 라이브러리** | C/C++ 네이티브 라이브러리 | OpenCV, OpenSSL |

### Direct ByteBuffer 예시

```java
// 힙 버퍼: JVM 힙에 할당 → GC가 관리
ByteBuffer heapBuffer = ByteBuffer.allocate(1024);

// Direct 버퍼: 네이티브 메모리에 할당 → GC가 직접 관리하지 않음
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
```

<div className="warning-box">
  <strong>Direct ByteBuffer와 GC의 관계</strong><br/><br/>
  <code>ByteBuffer.allocateDirect()</code>로 생성한 Direct 버퍼는 GC가 직접 관리하지 않습니다.<br/>
  힙에 있는 <code>DirectByteBuffer</code> <strong>래퍼 객체</strong>가 GC될 때 내부 <code>Cleaner</code>가 네이티브 메모리를 해제하는 구조입니다.<br/><br/>
  즉, 래퍼 객체가 GC되지 않으면 네이티브 메모리도 해제되지 않습니다.
  이것이 네이티브 메모리 누수의 원인이 되며, 시리즈 2편에서 자세히 다룹니다.
</div>

### 네이티브 메모리 설정

| 옵션 | 설명 | 예시 |
|------|------|------|
| `-XX:MaxDirectMemorySize` | Direct Buffer 최대 크기 | `-XX:MaxDirectMemorySize=256m` |
| `-XX:MaxMetaspaceSize` | Metaspace 최대 크기 | `-XX:MaxMetaspaceSize=256m` |
| `-Xss` | 스레드 스택 크기 | `-Xss512k` |

---

## 정리

| 구분 | 힙 메모리 | 네이티브 메모리 |
|------|----------|----------------|
| **누가 관리하나** | GC가 자동 회수 | 직접 해제해야 함 |
| **무엇을 저장하나** | Java 객체 (String, List, DTO) | 바이트 버퍼, SSL, 클래스 정보 |
| **크기 설정** | `-Xmx` | `-XX:MaxDirectMemorySize` |
| **문제 발생 시** | `OutOfMemoryError: Java heap space` | RSS 증가, OS가 프로세스 종료 |
| **핵심 포인트** | 참조를 끊으면 GC가 회수 | 사용 후 반드시 해제 |

Java에서 `new`로 만든 객체는 GC가 알아서 치워주지만, 네이티브 메모리는 직접 관리해야 합니다.
다음 편에서는 이 두 영역에서 **메모리 누수가 발생하는 패턴**과 해결법을 다룹니다.
