---
title: "폴링, 롱폴링, SSE, WebSocket — 네 가지 실시간 통신 방식과 선택 기준"
date: "2026-07-21"
description: "폴링·롱폴링·SSE·WebSocket을 HTTP의 무상태·비연결성 제약이라는 관점에서 정리하고, 통신 방향·실시간성·동시 사용자 수로 방식을 좁혀 가는 선택 기준을 설명합니다."
category: "개발"
subcategory: "웹"
tags: ["guide", "intermediate"]
thumbnail: "/images/thumbnails/realtime-communication"
series: "realtime-communication"
seriesOrder: 1
glossary:
  - id: "sse"
    term: "SSE"
    brief: "HTTP 응답을 열어둔 채 서버가 클라이언트로 이벤트를 계속 밀어 보내는 단방향 스트림"
    detail: "Server-Sent Events의 약자입니다. 클라이언트가 `text/event-stream` 응답을 요청하면 서버는 응답을 끝내지 않고 열어둔 채 데이터를 조금씩 흘려보냅니다. HTTP 위에서 동작하므로 별도 소켓 서버가 필요 없고, 브라우저의 `EventSource`가 자동 재연결까지 처리합니다. 다만 서버에서 클라이언트로 가는 단방향만 지원합니다."
  - id: "long-polling"
    term: "롱 폴링"
    brief: "요청을 받고도 즉시 응답하지 않고, 이벤트가 생길 때까지 응답을 보류하는 방식"
    detail: "클라이언트가 요청을 보내면 서버는 곧바로 응답하지 않고 이벤트가 발생할 때까지 기다립니다. 이벤트가 생기면 그때 응답하고, 아무 일도 없으면 타임아웃 시점에 빈 응답을 돌려줍니다. 클라이언트는 응답을 받는 즉시 다시 요청하므로 항상 대기 중인 요청이 하나 유지됩니다. 폴링의 빈 응답 낭비를 줄인 형태입니다."
  - id: "event-source"
    term: "EventSource"
    brief: "SSE 스트림을 구독하는 브라우저 내장 API"
    detail: "브라우저가 기본 제공하는 SSE 클라이언트 API입니다. 연결이 끊기면 자동으로 재연결을 시도하고, 서버가 보낸 `id` 필드를 기억했다가 재연결 시 `Last-Event-ID` 헤더로 되돌려 줍니다. 대신 GET 요청만 가능하고 `Authorization` 같은 커스텀 헤더를 붙일 수 없다는 제약이 있습니다."
  - id: "handshake"
    term: "핸드셰이크"
    brief: "HTTP 요청으로 시작해 WebSocket 프로토콜로 전환하는 최초 교섭 절차"
    detail: "WebSocket 연결은 평범한 HTTP GET 요청에 `Upgrade: websocket` 헤더를 붙여 시작합니다. 서버가 `101 Switching Protocols`로 응답하면 그 TCP 연결은 더 이상 HTTP가 아니라 WebSocket 프레임 단위로 통신합니다. 이후 프레임 헤더는 2~14바이트 수준이라 HTTP 헤더에 비하면 오버헤드가 거의 없습니다."
  - id: "deferred-result"
    term: "DeferredResult"
    brief: "Spring MVC에서 응답을 보류한 채 서블릿 스레드를 반납하는 비동기 반환 타입"
    detail: "Spring 3.2부터 제공하는 비동기 처리 타입입니다. 컨트롤러가 `DeferredResult`를 반환하면 서블릿 스레드는 즉시 스레드 풀로 반납되고 커넥션만 열린 채 유지됩니다. 나중에 다른 스레드에서 `setResult()`를 호출하면 보류돼 있던 응답이 완료됩니다. 롱 폴링을 구현할 때 이 처리가 없으면 대기 중인 클라이언트 수만큼 스레드가 묶입니다."
  - id: "heartbeat"
    term: "하트비트"
    brief: "유휴 연결이 끊기지 않도록 주기적으로 보내는 의미 없는 신호"
    detail: "프록시나 로드밸런서는 일정 시간 데이터가 오가지 않는 커넥션을 강제로 끊습니다. 이를 막기 위해 15~30초 간격으로 주석 라인이나 더미 이벤트를 흘려보내 연결이 살아 있음을 알립니다. SSE에서는 `: ping`처럼 콜론으로 시작하는 주석 프레임을 쓰면 클라이언트 이벤트 핸들러를 건드리지 않고 연결만 유지할 수 있습니다."
  - id: "thundering-herd"
    term: "Thundering Herd"
    brief: "대기 중이던 다수의 요청이 한 시점에 동시에 깨어나 부하가 몰리는 현상"
    detail: "롱 폴링에서 브로드캐스트를 보내면 보류돼 있던 응답이 한꺼번에 완료되고, 클라이언트들이 곧바로 동시에 재요청을 보냅니다. 평상시 부하는 낮지만 이벤트 시점에 스파이크가 생깁니다. 재요청 시점에 무작위 지연(jitter)을 섞거나 브로드캐스트 대상을 배치로 나눠 완화합니다."
  - id: "last-event-id"
    term: "Last-Event-ID"
    brief: "SSE 재연결 시 브라우저가 마지막으로 받은 이벤트 ID를 서버에 알려주는 헤더"
    detail: "서버가 이벤트에 `id:` 필드를 붙여 보내면 브라우저는 그 값을 기억합니다. 연결이 끊겨 자동 재연결할 때 `Last-Event-ID` 요청 헤더로 그 값을 되돌려 주므로, 서버는 끊긴 동안 놓친 이벤트를 골라 재전송할 수 있습니다. 표준이 제공하는 몇 안 되는 복구 장치입니다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/realtime-communication-light.png" alt="폴링, 롱폴링, SSE, WebSocket 네 가지 통신 방식이 대시보드로 데이터를 전달하는 모습" />
      <img className="theme-dark" src="/images/thumbnails/realtime-communication-dark.png" alt="폴링, 롱폴링, SSE, WebSocket 네 가지 통신 방식이 대시보드로 데이터를 전달하는 모습" />
    </div>
  </div>
  <figcaption>그림 1. 네 가지 중 무엇으로 대시보드에 데이터를 흘려보낼 것인가</figcaption>
</figure>

## 들어가며

실무에서 폴링, 롱폴링, <Term id="sse">SSE</Term>, WebSocket에 대해서 각각 어떤 상황에서 사용해야할지 대략적인 감각은 있는데, 가끔 어떤걸 써야할지 헷갈려서 다시 검색해 본 경험이 있습니다. 최근 작업이 그랬습니다. 제품 대시보드에서 데이터를 뿌려 주는 코드를 작업하면서 폴링과 SSE 중 무엇을 쓸지 고민했습니다. 이번 기회에 각 통신 방식을 정리해서 이해한 뒤 비교해 보려고 합니다.

고민의 구체적인 모양은 이랬습니다. 같은 제품, 같은 대시보드에 주기적으로 갱신해야 하는 화면이 두 개였습니다. 하나는 데몬 서비스에서 처리 파이프라인이 흘러가는 모습을 초 단위로 보여 주는 화면이고, 다른 하나는 여러 통계 위젯을 모아 놓은 요약 대시보드입니다. 파이프라인 화면은 이번에 새로 만드는 페이지였고, 요약 대시보드는 원래 접속했을 때 한 번만 조회하던 화면에 주기적 갱신을 붙이는 작업이었습니다. 둘 다 "실시간으로 갱신되는 화면"이니 SSE로 같은 방식으로 만드는 게 자연스러워 보였습니다.

결과적으로는 다르게 갔습니다. 처리 파이프라인 화면은 SSE로, 요약 대시보드는 폴링으로 만들었습니다. 둘 다 실시간 갱신이 필요하다는 점만 보면 SSE가 우세해 보이지만, 갱신 주기의 폭과 장애가 났을 때의 리스크, 실제 처리량, 만드는 데 드는 비용을 같이 놓고 보면 답이 갈렸습니다. 이 글에서는 네 방식을 먼저 정리하고 선택 기준을 세우는 데 집중하고, "대시보드니까 SSE"로 결론 내지 않은 실제 판단 과정은 다음 글에서 자세히 다룹니다.

## HTTP는 왜 실시간에 부적합한가

실시간 기술을 이해하려면 HTTP의 두 가지 성질을 먼저 짚어야 합니다.

| 특성 | 내용 | 실시간 관점의 문제 |
|------|------|------------------|
| 무상태 (Stateless) | 서버가 클라이언트 상태를 보존하지 않음 | 서버가 "누구에게 보낼지" 모름 |
| 비연결성 (Connectionless) | 요청-응답이 끝나면 연결 종료 | 보낼 통로 자체가 없음 |

HTTP에서 통신은 항상 클라이언트 요청으로만 시작됩니다. 서버에 새 데이터가 생겨도 먼저 전달할 방법이 없습니다. 여기서 두 갈래 접근이 나옵니다.

- **요청 패턴을 조작한다**: HTTP를 그대로 쓰되 요청을 반복하거나 응답을 미룹니다 → 폴링, 롱 폴링
- **연결을 유지하거나 프로토콜을 바꾼다**: 응답을 끝내지 않거나 아예 다른 프로토콜로 갈아탑니다 → SSE, WebSocket

## 폴링과 롱 폴링

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/realtime-communication-polling-sse-websocket/polling-vs-longpolling-light.png" alt="폴링과 롱 폴링의 요청-응답 시퀀스 비교" />
      <img className="theme-dark" src="/images/posts/realtime-communication-polling-sse-websocket/polling-vs-longpolling-dark.png" alt="폴링과 롱 폴링의 요청-응답 시퀀스 비교" />
    </div>
  </div>
  <figcaption>그림 2. 폴링은 주기마다 묻고, 롱 폴링은 답이 나올 때까지 기다린다</figcaption>
</figure>

### 폴링

클라이언트가 일정 주기마다 서버에 "새 데이터 있나요?"를 반복해서 묻습니다. 언제 이벤트가 발생할지 예측할 수 없으니 주기적으로 확인하는 방식입니다. 가장 단순하고 어떤 환경에서도 동작합니다.

구현할 때 한 가지 주의할 점이 있습니다.

```javascript
// setInterval은 응답이 주기보다 오래 걸리면 요청이 겹쳐 쌓입니다
setInterval(() => fetch('/api/status').then(render), 3000);

// 응답이 끝난 뒤에 다음 주기를 예약합니다
async function poll() {
    try {
        const res = await fetch('/api/status');
        render(await res.json());
    } catch (e) {
        console.error('polling failed', e);
    } finally {
        setTimeout(poll, 3000);
    }
}
poll();
```

`setInterval`은 이전 요청이 끝났는지 신경 쓰지 않고 주기마다 새 요청을 발사합니다. 서버가 느려지면 요청이 중첩되고, 요청이 쌓이면 서버가 더 느려집니다. 폴링은 재귀 예약 방식으로 구현합니다.

폴링의 본질적인 한계는 지연과 부하가 반비례한다는 점입니다.

| 주기 | 평균 지연 | 사용자 1,000명 기준 요청 수 |
|------|----------|--------------------------|
| 30초 | 15초 | 33 req/s |
| 5초 | 2.5초 | 200 req/s |
| 1초 | 0.5초 | 1,000 req/s |

실시간성을 높이려면 주기를 줄여야 하고, 주기를 줄이면 부하가 커집니다. 주기를 어떻게 조절해도 두 문제를 동시에 해결할 수는 없습니다.

**요청 수만 문제가 아니라 요청 하나하나도 생각보다 비쌉니다.** 실제 데이터는 수십 바이트인데 요청마다 붙는 헤더는 훨씬 큽니다.

```http
GET /api/notifications/count HTTP/1.1
Host: example.com
Cookie: JSESSIONID=...; _ga=...; refresh_token=...
User-Agent: Mozilla/5.0 (...)
Accept: application/json
```

쿠키가 붙으면 헤더만 수백 바이트에서 수 KB에 이릅니다. 그런데 돌아오는 응답 본문은 `{"count":0}` 11바이트일 수 있습니다. 아무 일도 없었다는 사실을 확인하려고 매번 이 비용을 지불합니다.

실제로 재 보면 감이 옵니다. 실무에서 운영하는 대시보드 화면에서 HAR을 내보내 위젯 요청들의 `request.headersSize`를 뽑아 봤습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img src="/images/posts/realtime-communication-polling-sse-websocket/har-header-size.png" alt="HAR에서 추출한 대시보드 위젯 요청별 헤더 크기. 요청마다 862~929바이트를 기록하고 있다" />
    </div>
  </div>
  <figcaption>그림 3. 위젯 요청 하나마다 헤더로만 900바이트 안팎이 나간다</figcaption>
</figure>

요청 하나에 약 900바이트입니다. 위젯 열한 개가 한 번씩 갱신되면 헤더로만 10 KB 가까이 나가고, 그중 대부분은 매 요청 똑같이 반복되는 쿠키와 `User-Agent`입니다. 직접 확인하려면 개발자 도구의 Network 패널에서 **Save all as HAR**로 내보낸 뒤 이렇게 뽑으면 됩니다.

```bash
jq '.log.entries[] | {url: .request.url, headerBytes: .request.headersSize}' dashboard.har
```

다만 이건 HTTP/1.1 기준입니다. HTTP/2부터는 헤더 압축(HPACK)이 적용돼, 한 번 주고받은 헤더가 이후 요청에서는 인덱스 몇 바이트로 줄어듭니다. 헤더 오버헤드를 폴링의 결정적 단점으로 꼽기 전에 운영 환경이 HTTP/1.1인지부터 봐야 합니다. 반면 요청 수 자체가 늘어나는 문제는 프로토콜 버전과 무관하게 그대로 남습니다.

그래서 폴링은 몇 초쯤 늦어도 괜찮은 화면에 어울립니다. 배치 작업 진행률이나 배포 상태가 그렇습니다. 데이터가 바뀌는 주기 자체가 길면 더 잘 맞습니다.

### 롱 폴링

<Term id="long-polling">롱 폴링</Term>은 요청을 보낸 뒤 서버가 즉시 응답하지 않고, 이벤트가 생길 때까지 응답을 보류합니다. 이벤트가 발생하면 그때 응답하고, 없으면 타임아웃까지 기다립니다. 폴링의 빈 응답 낭비를 제거한 형태입니다.

Spring에서는 <Term id="deferred-result">DeferredResult</Term>로 구현합니다.

```java
@RestController
public class NoticeController {

    private final Map<String, DeferredResult<List<Notice>>> waiting = new ConcurrentHashMap<>();

    @GetMapping("/api/notices/subscribe")
    public DeferredResult<List<Notice>> subscribe(@RequestParam String userId) {
        // 타임아웃(30초) 시 빈 목록으로 응답
        DeferredResult<List<Notice>> result = new DeferredResult<>(30_000L, List.of());
        waiting.put(userId, result);

        result.onCompletion(() -> waiting.remove(userId));
        result.onTimeout(() -> waiting.remove(userId));
        return result;
    }

    // 이벤트가 발생한 곳에서 호출합니다
    public void publish(String userId, List<Notice> notices) {
        DeferredResult<List<Notice>> result = waiting.get(userId);
        if (result != null) {
            result.setResult(notices);   // 보류 중이던 응답을 완료
        }
    }
}
```

`DeferredResult`를 반환하면 서블릿 스레드가 즉시 풀로 반납되고 커넥션만 열린 채 유지됩니다. 이 비동기 처리가 없으면 대기 중인 클라이언트 수만큼 스레드가 묶여 스레드 풀이 고갈됩니다. 롱 폴링에서 가장 먼저 확인할 부분입니다.

클라이언트는 응답을 받는 즉시 다시 요청합니다.

```javascript
async function longPoll() {
    try {
        const res = await fetch('/api/notices/subscribe?userId=' + userId);
        const data = await res.json();
        if (data.length) render(data);
    } catch (e) {
        await new Promise(r => setTimeout(r, 3000));   // 실패 시 백오프
    }
    longPoll();
}
longPoll();
```

롱 폴링에서 조심할 부분은 <Term id="thundering-herd">Thundering Herd</Term>입니다. 동시 접속자 1만 명에게 같은 이벤트를 뿌리면 1만 개의 보류 응답이 동시에 완료되고, 곧바로 1만 개의 재요청이 몰려옵니다. 평상시 부하는 낮은데 이벤트 시점에만 스파이크가 생깁니다. 재요청 시점에 무작위 지연을 섞거나 브로드캐스트를 배치로 나눠 완화합니다.

한계는 이뿐이 아닙니다. 이벤트가 뜰 때마다 응답이 끝나고 새 요청이 다시 나가므로, 앞서 본 요청당 헤더 비용을 이벤트 빈도만큼 반복해서 치릅니다. 이벤트가 잦아질수록 폴링과 구분이 흐려집니다. 복구 장치도 약합니다. SSE의 `EventSource`가 표준으로 제공하는 자동 재연결과 놓친 이벤트 복구가 여기에는 없어 직접 만들어야 하고, 응답과 재요청 사이의 짧은 공백에 발생한 이벤트는 서버가 큐에 담아 두지 않으면 흘려버립니다.

그래서 롱 폴링은 요즘 첫 번째 선택지가 되는 경우가 드뭅니다. 스트리밍 응답을 버퍼링해 버리는 프록시나 `EventSource`가 없는 구형 브라우저처럼, SSE와 WebSocket을 쓸 수 없는 환경의 현실적인 대안에 가깝습니다.

## SSE와 WebSocket

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/realtime-communication-polling-sse-websocket/sse-vs-websocket-light.png" alt="SSE와 WebSocket의 연결 방식 비교" />
      <img className="theme-dark" src="/images/posts/realtime-communication-polling-sse-websocket/sse-vs-websocket-dark.png" alt="SSE와 WebSocket의 연결 방식 비교" />
    </div>
  </div>
  <figcaption>그림 4. SSE는 응답을 열어둔 채 밀어 보내고, WebSocket은 프로토콜을 바꿔 양방향 회선을 연다</figcaption>
</figure>

### SSE

응답을 끝내지 않고 열어둔 채 데이터를 조금씩 흘려보냅니다. HTTP를 그대로 쓰면서 서버 푸시를 구현하는 표준 방식입니다.

요청과 응답 헤더가 규격으로 정해져 있습니다.

```http
GET /api/notices/subscribe HTTP/1.1
Accept: text/event-stream
Cache-Control: no-cache
```

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8
Cache-Control: no-cache
Connection: keep-alive
```

본문은 `필드: 값` 형태를 줄바꿈 두 번으로 구분한 텍스트 스트림입니다.

| 필드 | 용도 |
|------|------|
| `data:` | 실제 전송 데이터 (여러 줄 가능) |
| `event:` | 이벤트 이름. 클라이언트에서 타입별 리스너 등록에 사용 |
| `id:` | 이벤트 ID. 재연결 시 `Last-Event-ID` 헤더로 되돌아옴 |
| `retry:` | 재연결 대기 시간(ms) 지정 |

```
event: notice
id: 42
data: {"title":"결재 요청","from":"user-01"}

: heartbeat

```

Spring에서는 `SseEmitter`로 구현합니다.

```java
@GetMapping(value = "/api/notices/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter subscribe(@RequestParam String userId,
                            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId) {
    SseEmitter emitter = new SseEmitter(60L * 60 * 1000);   // 타임아웃 1시간
    emitters.put(userId, emitter);

    emitter.onCompletion(() -> emitters.remove(userId));
    emitter.onTimeout(() -> emitters.remove(userId));
    emitter.onError(e -> emitters.remove(userId));

    // 재연결이라면 놓친 이벤트를 재전송합니다
    if (lastEventId != null) {
        resendMissedEvents(emitter, userId, lastEventId);
    }
    return emitter;
}
```

클라이언트는 <Term id="event-source">EventSource</Term> 몇 줄이면 끝납니다.

```javascript
const source = new EventSource('/api/notices/subscribe?userId=' + userId);

source.addEventListener('notice', (e) => {
    render(JSON.parse(e.data));
});

source.onerror = () => {
    // 브라우저가 자동으로 재연결을 시도합니다.
    // 영구 종료가 필요하면 source.close()를 명시적으로 호출합니다.
};
```

<div className="info-box">
SSE에만 있는 제약이 두 가지 있습니다.

- **HTTP/1.1의 동시 연결 6개 제한**: 브라우저는 도메인당 커넥션을 6개로 제한하는데, SSE 연결 하나가 그 자리를 계속 차지합니다. 탭을 여러 개 열면 나머지 요청이 대기 상태에 빠집니다. HTTP/2는 멀티플렉싱으로 이 문제가 사라지므로, SSE 도입 전에 HTTP/2 적용 여부부터 확인해야 합니다.
- **커스텀 헤더 불가**: `EventSource`는 `Authorization` 헤더를 지정할 수 없습니다. 쿠키 기반 인증을 쓰거나, 토큰을 쿼리 파라미터로 넘기거나(액세스 로그에 남는 점 주의), `fetch` 스트림으로 직접 구현해야 합니다.
</div>

### WebSocket

앞의 세 방식은 모두 HTTP 위에서 동작합니다. WebSocket은 아예 다른 프로토콜로 갈아탑니다. 연결이 열린 뒤에는 양쪽 모두 언제든 데이터를 보낼 수 있습니다.

연결은 평범한 HTTP 요청으로 시작합니다.

```http
GET /ws/chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`101 Switching Protocols`는 "이제부터 이 TCP 연결로 다른 프로토콜을 쓴다"는 뜻입니다. 이 <Term id="handshake">핸드셰이크</Term> 이후 통신은 HTTP가 아니라 WebSocket 프레임 단위로 이루어집니다. 프레임 헤더는 2~14바이트 수준이라 HTTP 헤더와 비교하면 오버헤드가 거의 없습니다.

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("https://example.com")
                .withSockJS();          // WebSocket 미지원 환경에서 롱폴링으로 폴백
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
```

```javascript
const socket = new WebSocket('wss://example.com/ws/chat');

socket.onopen = () => socket.send(JSON.stringify({ type: 'join', roomId }));
socket.onmessage = (e) => render(JSON.parse(e.data));
socket.onclose = (e) => {
    if (!e.wasClean) reconnectWithBackoff();   // 재연결은 직접 구현해야 합니다
};
```

<div className="warning-box">
SSE와 달리 재연결을 직접 구현해야 합니다. `onclose`에서 지수 백오프와 최대 재시도 횟수를 넣지 않으면, 서버 장애 시 전 클라이언트가 동시에 재연결을 시도해 복구를 방해합니다. 연결이 끊긴 동안 발생한 메시지도 자동으로 복구되지 않으므로, 마지막 수신 ID를 저장했다가 재연결 시 그 이후를 조회하는 로직이 필요합니다.
</div>

## 연결을 유지하는 방식의 공통 과제

롱 폴링, SSE, WebSocket은 "연결을 오래 유지한다"는 성질을 공유하므로, 세부 구현과 무관하게 같은 문제를 만납니다.

| 과제 | 내용 | 대응 |
|------|------|------|
| 스레드 고갈 | 동기 처리 시 대기 커넥션 수만큼 스레드 점유 | 서블릿 비동기(`DeferredResult`, `SseEmitter`) 또는 WebFlux |
| 프록시 타임아웃 | LB·프록시가 유휴 커넥션을 강제 종료 | 15~30초 간격 <Term id="heartbeat">하트비트</Term>, 프록시 타임아웃 조정 |
| 응답 버퍼링 | 프록시가 스트림을 모았다가 뭉쳐서 전송 | `X-Accel-Buffering: no`, `proxy_buffering off` |
| 스케일아웃 | 연결이 특정 인스턴스에 고정돼 다른 인스턴스의 사용자에게 전달 불가 | Redis Pub/Sub, 외부 메시지 브로커 |
| 커넥션 누수 | 클라이언트 종료를 서버가 알아채지 못함 | 종료·타임아웃·에러 콜백에서 반드시 정리 |
| 재연결 중복 | 재연결 후 같은 이벤트를 다시 수신 | 이벤트 ID 기반 멱등 처리 |

## 네 방식 비교

| 항목 | 폴링 | 롱 폴링 | SSE | WebSocket |
|------|------|---------|-----|-----------|
| 통신 방향 | 단방향 (요청) | 단방향 (요청) | 단방향 (수신) | 양방향 |
| 프로토콜 | HTTP | HTTP | HTTP (`text/event-stream`) | ws / wss |
| 실시간성 | 낮음 (주기만큼 지연) | 중간 | 높음 | 높음 |
| 요청 횟수 | 주기마다 계속 | 이벤트/타임아웃마다 | 최초 1회 | 최초 1회 |
| 부하의 성격 | 요청 처리 횟수 | 요청 횟수 + 커넥션 수 | 대기 커넥션 수 | 대기 커넥션 수 |
| 구현 난이도 | 낮음 | 중간 | 낮음 | 높음 |
| 자동 재연결 | 해당 없음 | 직접 구현 | 브라우저 내장 | 직접 구현 |
| 전송 데이터 | 제한 없음 | 제한 없음 | UTF-8 텍스트만 | 텍스트 + 바이너리 |

"서버 부하"를 단순히 높다/낮다로 비교하기는 어렵습니다. 폴링은 **요청 처리 횟수**로 부하가 오고, SSE와 WebSocket은 **동시 유지 커넥션 수**로 부하가 옵니다. 비용의 종류가 다르므로 트래픽 패턴에 따라 유불리가 뒤집힙니다.

롱 폴링만 양쪽을 다 치릅니다. 응답을 보류하는 동안 커넥션을 붙들고 있으면서, 이벤트가 발생하거나 타임아웃될 때마다 새 요청을 받습니다. 폴링보다 요청 수는 적지만 커넥션은 계속 물고 있으니, 두 종류의 비용을 함께 관리해야 합니다. 롱 폴링이 첫 번째 선택지가 되기 어려운 이유 중 하나입니다.

## 어떻게 고를 것인가

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/realtime-communication-polling-sse-websocket/decision-flow-light.png" alt="실시간 통신 방식 선택 플로우차트" />
      <img className="theme-dark" src="/images/posts/realtime-communication-polling-sse-websocket/decision-flow-dark.png" alt="실시간 통신 방식 선택 플로우차트" />
    </div>
  </div>
  <figcaption>그림 5. 통신 방향과 실시간성으로 좁히고, SSE를 못 쓰는 환경만 롱 폴링으로 폴백한다</figcaption>
</figure>

기술을 먼저 고르고 요구사항을 맞추면 과설계가 됩니다. 통신 방향과 실시간성 요구 순으로 좁혀 갑니다.

그림에서 방식을 실제로 가르는 축은 실시간 갱신이 필요한지입니다. 몇 초쯤 늦어도 되면 폴링, 이벤트를 즉시 받아야 하면 SSE로 갑니다. 서버가 클라이언트로 밀어 보내는 단방향 실시간 갱신에는 SSE가 기본값입니다. 앞서 짚은 HTTP/1.1 연결 수 제한이나 프록시 버퍼링은 SSE의 전제조건이 아니라 특정 환경에서만 걸리는 예외라, 대부분의 현대 인프라에서는 그대로 동작합니다. 롱 폴링은 그 SSE를 쓸 수 없는 환경, 예를 들어 `EventSource`가 없는 구형 브라우저나 스트리밍 응답을 버퍼링하는 프록시에서 같은 효과를 대신 내는 폴백입니다. 앞서 본 한계를 그대로 안고 가므로, SSE를 쓸 수 있으면 SSE가 낫습니다.

| 기능 | 적합한 방식 | 이유 |
|------|-----------|------|
| 알림, 결재 요청, 뉴스 피드 | SSE | 서버 → 클라이언트 단방향, 구현이 단순하고 재연결이 자동 |
| 채팅, 협업 편집 | WebSocket | 양방향이 필수 |
| 배치·배포 진행률 | 폴링 | 지연 허용, 짧게 끝나는 작업 |
| AI 응답 스트리밍 | SSE | 토큰 단위 단방향 푸시 |
| 대시보드 지표 갱신 | SSE 또는 폴링 | 갱신 주기가 길면 폴링으로 충분 |
| 실시간 시세, 관제 | WebSocket | 초저지연 + 바이너리 |

### 동시 사용자 수가 손익분기를 바꾼다

플로우차트는 통신 방향이나 실시간성 같은 정성적인 축만 다룹니다. 그런데 실제로 결정을 뒤집는 건 동시 사용자 수인 경우가 많습니다. 두 방식은 사용자가 늘어날 때 비용이 불어나는 방식 자체가 다릅니다.

- **폴링**: 요청 수 = 동시 사용자 × 화면의 갱신 요소 수 × (1 ÷ 주기). 사용자 수와 요소 수가 서로 곱해집니다.
- **연결 유지**: 커넥션 수 = 동시 사용자. 대신 서버의 데이터 조회는 브로드캐스트 한 번으로 끝나므로 사용자가 늘어도 그대로입니다.

곱셈이 일어난다는 점이 폴링의 약점입니다. 위젯 열 개짜리 화면을 100명이 5초 주기로 보고 있으면 초당 200건입니다. 같은 화면을 SSE로 만들면 커넥션 100개를 유지하는 대신 DB 조회는 5초에 한 번입니다.

| 동시 사용자 | 폴링 | 연결 유지 (SSE / WebSocket) |
|------------|------|---------------------------|
| 수십 명 이하 | 요청 수의 절대량이 작아 부담 없음 | 재연결·세션·격리 비용만 떠안고 얻는 게 적음 |
| 수백~수천 명 | 사용자 × 요소 수로 요청이 곱해져 병목 | DB 조회를 한 번으로 공유해 유리 |
| 수만 명 이상 | 현실적으로 어려움 | 커넥션 수가 서버 자원 한계에 도달, 인스턴스 분산·브로커 필요 |

다만 이 표는 트래픽만 본 것입니다. 사용자가 적다고 폴링이 항상 정답은 아닙니다. 갱신을 초 단위로 당겨야 하거나 이벤트 발생 시점을 예측할 수 없다면, 사용자가 몇 명이든 서버가 주기를 쥐는 쪽이 낫습니다. 트래픽은 후보를 좁히는 축이지 혼자 결론을 내는 축은 아닙니다.

### 자주 하는 잘못된 판단

- **"실시간이니까 WebSocket"**: 단방향 알림에 WebSocket을 쓰면 재연결, 스케일아웃, 상태 관리 비용만 떠안습니다. SSE로 충분한 경우가 많습니다.
- **"폴링은 무조건 나쁘다"**: 동시 사용자가 적으면 폴링이 가장 저렴하고 안정적입니다. 인프라를 늘리지 않아도 된다는 장점이 큽니다.
- **"SSE는 서버 부하가 낮다"**: 요청 수는 적지만 연결은 계속 유지됩니다. 동시 접속 1만 명이면 커넥션 1만 개를 유지해야 하고, 비동기 처리가 없으면 스레드가 고갈됩니다.

## 마치며

정리하면 이렇습니다.

- HTTP는 무상태·비연결성이라 서버가 먼저 데이터를 보낼 수 없고, 네 방식 모두 이 제약을 다르게 해결합니다.
- 폴링은 주기적 재요청입니다. 지연과 요청 수가 반비례해서 둘 다 만족시킬 수 없습니다.
- 롱 폴링은 응답을 보류해 빈 응답을 없앱니다. SSE나 WebSocket을 쓸 수 없는 환경의 폴백에 가깝습니다.
- SSE는 HTTP 위의 표준 단방향 푸시입니다. 자동 재연결과 <Term id="last-event-id">Last-Event-ID</Term> 복구를 브라우저가 제공합니다.
- WebSocket은 프로토콜을 전환해 양방향 회선을 엽니다. 성능은 가장 좋지만 재연결, 스케일아웃, 인증을 모두 직접 설계해야 합니다.
- 선택 순서는 통신 방향 → 실시간성 요구입니다. 양방향이 아니면 WebSocket을 먼저 고려할 이유가 없고, 단방향 실시간 갱신은 SSE가 기본이며 SSE를 못 쓰는 환경에서만 롱 폴링으로 폴백합니다.
- 동시 사용자 수를 함께 세어 봅니다. 폴링은 사용자 수와 갱신 요소 수가 곱해지지만, 연결 유지 방식은 커넥션만 늘고 서버 조회는 한 번으로 공유됩니다. 이 손익분기가 어디 있느냐에 따라 같은 요구사항의 답이 바뀝니다.
- 갱신 주기의 폭도 봅니다. 몇 초에서 몇 시간까지 벌어지는 화면이라면 연결을 유지해서 얻을 게 적습니다. 연결 유지는 데이터가 자주 오는 화면에 맞는 도구입니다.

그리고 "실시간 화면"이라는 한 단어로 묶인 요구사항이라도, 갱신 주기의 폭과 장애 시 파급 범위, 처리량, 만드는 비용을 따로 따져 보면 답이 갈릴 수 있습니다. 제 경우에는 같은 대시보드 안에서 답이 갈렸는데, 그 실제 판단 과정을 다음 글에서 풀어 보겠습니다.

다음 글에서는 서두에 말한 두 화면이 왜 SSE와 폴링으로 갈렸는지를 자세히 짚고, SSE를 실제로 운영하면서 부딪힌 문제들까지 다룹니다. 중복 전송을 걸러 내는 방법, 여러 스레드에서 밀어 보낼 때 생기는 전송 순서 역전, 느린 클라이언트가 전체를 막지 않게 격리하는 방법 같은 것들입니다.

> 참고: [실시간 통신 기술 정리 (jay-ya.tistory.com)](https://jay-ya.tistory.com/160), [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), [RFC 6455 — The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
