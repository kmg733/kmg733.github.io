---
title: "폴링, 롱폴링, SSE, WebSocket — 대시보드에 뭘 쓸지 정하기까지"
date: "2026-07-21"
description: "실시간 통신 방식 네 가지를 HTTP의 제약이라는 관점에서 정리하고, 한 제품의 두 화면에 서로 다른 방식(SSE와 폴링)을 적용한 판단 근거를 갱신 주기·리스크·처리량·구현 비용으로 설명합니다."
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

실무에서 폴링, 롱폴링, <Term id="sse">SSE</Term>, WebSocket에 대해서 각각 어떤 상황에서 사용해야할지 대략적인 감각은 있는데, 가끔 어떤걸 써야할지 헷갈려서 다시 검색해 본 경험이 있습니다. 최근 작업이 그랬습니다. 제품 대시보드에서 데이터를 뿌려 주는 코드의 개선 작업을 하면서 폴링과 SSE 중 무엇을 쓸지 고민했습니다. 이번 기회에 각 통신 방식을 정리해서 이해한 뒤 비교해 보려고 합니다.

고민의 구체적인 모양은 이랬습니다. 같은 제품, 같은 대시보드 안에 실시간 화면이 두 개 있었습니다. 하나는 데몬 서비스에서 처리 파이프라인이 흘러가는 모습을 초 단위로 보여 주는 화면이고, 다른 하나는 여러 통계 위젯을 모아 놓은 요약 대시보드입니다. 파이프라인 화면은 이번에 새로 만드는 페이지였고, 요약 대시보드는 원래 접속했을 때 한 번만 조회하던 화면에 주기적 갱신을 붙이는 작업이었습니다. 둘 다 "실시간으로 갱신되는 화면"이니 SSE로 같은 방식으로 만드는 게 자연스러워 보였습니다.

결과적으로는 다르게 갔습니다. 처리 파이프라인 화면은 SSE로, 요약 대시보드는 폴링으로 만들었습니다. "대시보드니까 SSE"로 결론 내지 않은 이유는 이 글의 후반부에 작성하였습니다. 둘 다 실시간 갱신이 필요하다는 점만 보면 SSE가 우세해 보이지만, 갱신 주기의 폭과 장애가 났을 때의 리스크, 실제 처리량, 만드는 데 드는 비용을 같이 놓고 보면 답이 갈렸습니다.

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

#### 요청 하나의 비용

요청 수만 문제가 아니라 요청 하나하나도 생각보다 비쌉니다. 실제 데이터는 수십 바이트인데 요청마다 붙는 헤더는 훨씬 큽니다.

```http
GET /api/notifications/count HTTP/1.1
Host: example.com
Cookie: JSESSIONID=...; _ga=...; refresh_token=...
User-Agent: Mozilla/5.0 (...)
Accept: application/json
```

쿠키가 붙으면 헤더만 수백 바이트에서 수 KB에 이릅니다. 그런데 돌아오는 응답 본문은 `{"count":0}` 11바이트일 수 있습니다. 아무 일도 없었다는 사실을 확인하려고 매번 이 비용을 지불합니다.

실제로 재 보면 감이 옵니다. 뒤에서 다룰 대시보드 화면에서 HAR을 내보내 위젯 요청들의 `request.headersSize`를 뽑아 봤습니다.

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

롱 폴링은 요즘 첫 번째 선택지가 되는 경우는 드뭅니다. WebSocket을 막는 기업 프록시 환경이나 구형 브라우저를 지원해야 할 때의 현실적인 대안에 가깝습니다.

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
SSE에서 실무적으로 걸리는 지점이 몇 가지 있습니다.

- **HTTP/1.1의 동시 연결 6개 제한**: 브라우저는 도메인당 커넥션을 6개로 제한하는데, SSE 연결 하나가 그 자리를 계속 차지합니다. 탭을 여러 개 열면 나머지 요청이 대기 상태에 빠집니다. HTTP/2는 멀티플렉싱으로 이 문제가 사라지므로, SSE 도입 전에 HTTP/2 적용 여부부터 확인해야 합니다.
- **커스텀 헤더 불가**: `EventSource`는 `Authorization` 헤더를 지정할 수 없습니다. 쿠키 기반 인증을 쓰거나, 토큰을 쿼리 파라미터로 넘기거나(액세스 로그에 남는 점 주의), `fetch` 스트림으로 직접 구현해야 합니다.
- **프록시 버퍼링**: Nginx 같은 리버스 프록시가 응답을 버퍼링하면 이벤트가 즉시 전달되지 않고 뭉쳐서 나갑니다. `X-Accel-Buffering: no` 헤더를 붙이거나 `proxy_buffering off`로 꺼야 합니다.
- **<Term id="heartbeat">하트비트</Term>**: 프록시나 로드밸런서는 일정 시간 데이터가 없는 커넥션을 끊습니다. 15~30초 간격으로 주석 프레임을 흘려 연결을 유지합니다.
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
WebSocket에서 가장 자주 발목을 잡는 것은 스케일아웃입니다. WebSocket 연결은 특정 서버 인스턴스에 묶입니다. 서버가 2대이고 A 사용자가 1번 서버, B 사용자가 2번 서버에 붙어 있으면 A가 보낸 메시지가 B에게 도달하지 않습니다. 인스턴스 간 메시지를 중계할 외부 브로커(Redis Pub/Sub, RabbitMQ 등)를 함께 설계해야 합니다.

재연결도 직접 구현해야 합니다. `onclose`에서 지수 백오프와 최대 재시도 횟수를 넣지 않으면, 서버 장애 시 전 클라이언트가 동시에 재연결을 시도해 복구를 방해합니다. 연결이 끊긴 동안 발생한 메시지도 자동으로 복구되지 않으므로, 마지막 수신 ID를 저장했다가 재연결 시 그 이후를 조회하는 로직이 필요합니다.
</div>

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
  <figcaption>그림 5. 통신 방향 → 실시간성 요구 → 인프라 제약 순으로 좁힌다</figcaption>
</figure>

기술을 먼저 고르고 요구사항을 맞추면 과설계가 됩니다. 통신 방향, 실시간성 요구, 인프라 제약 순으로 좁혀 갑니다.

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

## 사례: 한 화면은 SSE, 한 화면은 폴링

여기서부터가 서두에 말한 고민의 결과입니다. 사내에서 운영하는 제품의 관리 콘솔 이야기이므로, 화면 이름과 구조는 일반화해서 적었습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/realtime-communication-polling-sse-websocket/dashboard-split-light.png" alt="처리 현황 화면은 SSE, 요약 대시보드 화면은 폴링으로 구성한 구조" />
      <img className="theme-dark" src="/images/posts/realtime-communication-polling-sse-websocket/dashboard-split-dark.png" alt="처리 현황 화면은 SSE, 요약 대시보드 화면은 폴링으로 구성한 구조" />
    </div>
  </div>
  <figcaption>그림 6. 같은 대시보드 안의 두 화면이 서로 다른 방식을 쓴다</figcaption>
</figure>

### 처리 현황 화면에 SSE를 쓴 이유

이 화면은 데이터가 처리 파이프라인을 통과하는 모습을 초 단위로 보여 줍니다. 서버에서 조회하는 데이터는 파이프라인 상태 하나뿐이고, 화면 전체가 그 하나를 바라봅니다.

**주기가 짧아서, 사용자가 늘면 그대로 부담이 됩니다.** 이 화면을 폴링으로 만들면 초 단위로 요청을 보내야 합니다. 지금 접속자 수라면 버티겠지만, 요청 수는 동시 사용자 수에 그대로 비례해 늘어납니다. 앞의 표에서 봤듯 1초 주기는 폴링에서 가장 비싼 구간입니다. 나중에 감당이 안 될 걸 알면서 그렇게 만들 이유가 없었습니다.

SSE로 만들면 사용자가 늘어도 서버가 하는 일은 그대로입니다. 브로드캐스트 한 번에 조회도 한 번이고, 늘어나는 건 유지할 커넥션 수뿐입니다.

**데이터 소스가 하나입니다.** 스트림 하나를 열면 화면에 필요한 모든 값이 그 위로 흐릅니다. 여러 API를 각각 호출할 필요가 없으니 SSE로 만드는 비용도 작았습니다.

**한산할 때는 아무것도 보내지 않습니다.** 파이프라인이 종일 바쁘지는 않고, 언제 바빠질지도 예측할 수 없습니다. 폴링이라면 아무 일이 없어도 화면을 켜둔 내내 초당 한 번씩 요청이 나갑니다. SSE에서는 서버가 상황을 보고 조절합니다.

- 구독자가 한 명도 없으면 DB 조회 자체를 하지 않습니다.
- 직전에 보낸 데이터와 동일하면 전송을 건너뜁니다.
- 빈 결과가 연속으로 몇 번 나오면 브로드캐스트 주기를 1초에서 5초로 늦추고, 데이터가 다시 생기면 곧바로 1초로 복귀합니다.

만들고 나서 알게 된 이점도 있습니다. 이 화면은 데이터가 흘러가는 모습을 애니메이션으로 그리는데, 클라이언트가 프레임 도착 간격을 재 두고 다음 프레임이 올 때까지 점을 균등하게 흘려보냅니다.

```javascript
// 직전 두 수신 시각의 간격을 재서, 다음 프레임이 올 시점을 예측합니다
const measured = now - lastFrameAt;
frameInterval = Math.min(Math.max(measured, 200), 6000);
spawnDeadline = now + frameInterval;
```

폴링이었다면 도착 간격에 네트워크 왕복과 조회 시간이 매번 더해져 애니메이션이 흔들렸을 겁니다. 주기를 1초로 잡아도 실제 도착은 1.05초였다가 1.3초가 되기도 하니까요. SSE는 서버가 자기 틱에 맞춰 밀어내므로 간격이 일정합니다. 이건 노리고 얻은 게 아니라 따라온 결과였습니다.

### 요약 대시보드에 폴링을 쓴 이유

같은 대시보드의 다른 탭입니다. 통계 위젯 열한 개가 한 화면에 올라가 있습니다. 여기서는 판단이 반대로 갔습니다.

출발점이 달랐습니다. 파이프라인은 새로 만드는 페이지였지만 이쪽은 이미 있는 화면이었고, 원래는 접속했을 때 한 번 조회하고 끝이었습니다. 이번 작업은 거기에 주기적 갱신을 붙이는 것이었습니다. 화면도 조회 경로도 그대로 있는 상태에서 갱신 방식만 고르면 되는 상황이었습니다.

**갱신 주기의 폭이 너무 넓습니다.** 관리자가 위젯별로 주기를 정하는데, 숫자와 단위(초 또는 분)를 직접 입력하고 상한이 없습니다. 몇 초마다 봐야 하는 위젯이 있는가 하면, 몇 시간에 한 번이면 충분한 위젯도 있습니다. 한 시간에 한 번 값이 바뀌는 위젯 때문에 커넥션을 한 시간 열어 두는 건 앞뒤가 맞지 않습니다. 그동안 오가는 건 하트비트뿐입니다.

파이프라인은 1초에서 5초 사이를 오갔습니다. 그 구간이라면 연결을 유지하는 편이 확실히 낫지만, 주기가 분과 시간 단위까지 벌어지면 유지해서 얻을 게 남지 않습니다.

게다가 이 주기는 관리자가 런타임에 바꿉니다. 폴링에서는 그게 공짜입니다. 클라이언트가 설정값을 읽어 위젯별 타이머를 걸고, 설정이 바뀌면 타이머를 다시 겁니다. 서버는 이 사실을 알 필요조차 없습니다.

SSE로 만들면 이 주기가 서버 상태가 됩니다. 위젯별 스케줄 열한 개를 서버가 들고 돌려야 하고, 관리자가 값을 바꾸면 런타임에 다시 등록해야 합니다. 그 비용은 파이프라인에서 이미 치러 봤습니다. 동적 주기가 하나뿐인데도 `@Scheduled`로 표현할 수 없어서 `Trigger`와 전용 스케줄러를 직접 만들어야 했습니다.

```java
// 활성 1초 / 유휴 5초. 주기가 런타임에 바뀌므로 고정 주기 애너테이션을 쓸 수 없습니다
Trigger broadcastTrigger = ctx -> {
    Instant base = ctx.lastCompletion() != null ? ctx.lastCompletion() : ctx.getClock().instant();
    return base.plusMillis(broadcastService.currentIntervalMs());
};
scheduler.schedule(broadcastService::broadcast, broadcastTrigger);
```

주기 하나에 이 정도였으니 열한 개면 그만큼 늘어납니다. 오해를 피하자면 SSE로 못 만든다는 뜻은 아닙니다. 위젯마다 이벤트 이름을 달아 한 스트림에 실으면 됩니다. 걸린 건 다른 지점이었습니다. "이 위젯을 얼마나 자주 볼 것인가"는 원래 화면 쪽 관심사인데, SSE로 만들면 그 정책이 서버 스케줄러로 올라갑니다. 서버는 데이터가 언제 바뀌는지를 알면 되지, 사용자가 얼마나 자주 보고 싶은지까지 알 이유가 없습니다.

**데이터가 하나로 묶이지 않습니다.** 파이프라인은 조회 한 번이 화면 전체를 채웁니다. 이 화면은 차트와 목록이 섞여 있고 위젯마다 집계 쿼리가 다릅니다. 스트림 하나에 담으려면 서버가 매 주기 열한 개 쿼리를 전부 돌려서 합쳐야 합니다. 이미 각자 REST 엔드포인트를 갖고 테이블·차트 컴포넌트에 물려 있는 구조를 통째로 다시 설계하는 일이 됩니다.

**요청과 응답이 1:1로 붙습니다.** 위젯 하나가 자기 주기에 자기 엔드포인트를 부르고, 받은 응답으로 자기 영역만 다시 그립니다. 무엇이 언제 왔는지가 요청 단위로 드러나서 만들기도 고치기도 단순합니다. SSE로 묶으면 위젯 열한 개의 데이터가 한 스트림에 섞여 흐르고, 어느 이벤트가 어느 위젯 것인지를 이름으로 갈라내야 합니다. 얻는 게 뚜렷했다면 감수할 만한 복잡도지만 여기서는 그렇지 않았습니다.

위젯을 개별로 끄는 것도 폴링 쪽이 자연스럽습니다. 끈 위젯은 타이머 자체가 돌지 않으니 요청이 아예 발생하지 않습니다.

장애가 났을 때의 파급 범위도 다릅니다. 스트림 하나로 열한 개 위젯을 먹이면, 그 연결이 끊기는 순간 화면 전체가 동시에 멈춥니다. 폴링은 위젯 단위로 독립적으로 실패합니다. 위젯 하나의 집계 쿼리가 느려지거나 실패해도 나머지 열 개는 계속 갱신됩니다.

**애초에 트래픽이 적습니다.** 이 콘솔은 소수의 담당자만 접속하는 화면이라 동시 사용자가 많아야 몇 명입니다. 앞에서 본 폴링 부하 표는 사용자 1,000명을 기준으로 잡았는데, 여기서는 그 숫자가 두세 자릿수 작아집니다. 위젯 열한 개가 각자 타이머를 돌려도 서버가 느끼는 부하는 미미했습니다. 폴링의 가장 큰 약점인 요청 수 폭증이 이 환경에서는 발생하지 않습니다.

트래픽이 많았다면 판단이 달라졌을 수도 있습니다. 위젯 열한 개 × 동시 사용자 수만큼 요청이 곱해지므로, 사용자가 수천 명이었다면 스트림 하나로 묶는 쪽이 유리해졌을 겁니다. 폴링을 택한 근거의 상당 부분은 이 시스템의 사용자 규모에 기대고 있습니다.

그런데 앞의 처리 현황 화면에서는 바로 그 "사용자가 늘어날 때"를 걱정해서 SSE로 갔습니다. 같은 시스템에서 반대로 판단한 셈인데, 요청 수를 세어 보면 오히려 대시보드 쪽이 많습니다. 위젯 열한 개를 5초마다 부르면 사용자당 초당 2.2건이고, 파이프라인을 1초마다 부르면 1건입니다.

갈린 지점은 요청 수가 아니라 **얻는 것과 치르는 것의 비율**이었습니다. 파이프라인은 폴링 비용이 가장 비싼 1초 구간인데 데이터 소스가 하나여서 SSE로 만드는 비용이 거의 없었습니다. 대시보드는 그 반대입니다. SSE로 만들려면 열한 개 조회를 서버 스케줄러로 재설계해야 하는데, 정작 주기가 길어 얻을 이득은 작습니다. 두 화면에서 이 비율이 정확히 뒤집혀 있었습니다.

### 대가로 치른 것

SSE를 선택한 화면에서 예상하지 못한 비용이 하나 나왔습니다. 사용자가 화면을 보고 있는데도 세션이 만료됩니다.

SSE는 최초 한 번만 HTTP 요청을 보내고 그 뒤로는 스트림을 열어 둡니다. 서버가 밀어 보내는 데이터는 새 요청이 아닙니다. 그래서 화면이 1초마다 갱신되고 사용자가 계속 보고 있어도, 서블릿 컨테이너 입장에서는 그 세션이 완전히 유휴 상태입니다. 설정된 세션 시간이 지나면 사용자가 화면을 보고 있는 도중에 세션이 만료됩니다.

주기적으로 실제 HTTP 요청을 한 번씩 보내 세션을 살려 두는 처리를 따로 넣어야 했습니다. 세션 시간의 절반 주기로, 하한을 두고 핑을 보냅니다.

```javascript
// 주기가 관리자 설정에 따라 달라지므로 setInterval이 아니라
// 재귀 setTimeout으로 매 주기마다 다시 계산합니다
async function scheduleNextPing() {
    const minutes = await getSessionTimeout();
    const intervalMs = Math.max(30000, (minutes * 60000) / 2);

    setTimeout(() => {
        sendSessionPing();
        scheduleNextPing();
    }, intervalMs);
}
```

폴링 화면에서는 이런 처리가 필요 없습니다. 갱신 요청 자체가 세션을 갱신하기 때문입니다. 흥미롭게도 이건 [멀티탭 세션 동기화](/blog/multitab-session-time-sync)에서 다룬 문제의 정반대 상황입니다. 그쪽에서는 백그라운드 폴링이 세션을 계속 살려 두는 바람에 유휴 만료가 트리거되지 않는 게 문제였습니다.

재연결도 직접 만들었습니다. 지수 백오프에 무작위 지연을 섞어, 서버가 잠깐 죽었다 살아날 때 모든 클라이언트가 동시에 몰리지 않도록 했습니다. 탭이 비활성 상태이거나 다른 탭을 보고 있으면 재연결을 시도하지 않게 막았는데, 이걸 빼먹으면 백그라운드에 좀비 연결이 쌓입니다.

### 정리: 두 화면을 가른 것들

두 화면은 이렇게 갈렸습니다.

| 축 | 처리 현황 화면 | 요약 대시보드 |
|----|--------------|-------------|
| **출발점** | 신규 페이지, 처음부터 방식을 선택 | 1회 조회하던 화면에 주기 갱신을 추가 |
| **갱신 주기** | 1~5초 고정 구간 | 몇 초 ~ 몇 시간, 관리자가 런타임 조정 |
| **데이터** | 단일 소스, 조회 하나가 화면 전체 | 위젯 11종, 서로 다른 집계 |
| **리스크** | 연결 끊김 = 이 화면만 영향 | 스트림 1개 장애 = 위젯 11개 동시 정지 |
| **처리량** | 사용자가 늘어도 조회는 브로드캐스트 1회 | 동시 사용자가 소수라 요청 수 폭증이 없음 |
| **만드는 비용** | 소스가 하나라 SSE로 묶기 쉬움 | 조회 11개 + 동적 스케줄 11개를 서버로 올려야 함 |

같은 제품, 같은 대시보드인데도 답이 갈렸습니다. "실시간 화면"이라는 표면적 공통점만 보고 한쪽으로 통일했다면, 어느 쪽을 골랐어도 다른 한쪽에서 대가를 치렀을 겁니다.

## 연결을 유지하는 방식의 공통 과제

롱 폴링, SSE, WebSocket은 "연결을 오래 유지한다"는 성질을 공유하므로 같은 문제를 만납니다.

| 과제 | 내용 | 대응 |
|------|------|------|
| 스레드 고갈 | 동기 처리 시 대기 커넥션 수만큼 스레드 점유 | 서블릿 비동기(`DeferredResult`, `SseEmitter`) 또는 WebFlux |
| 프록시 타임아웃 | LB·프록시가 유휴 커넥션을 강제 종료 | 하트비트 주기 전송, 프록시 타임아웃 조정 |
| 응답 버퍼링 | 프록시가 스트림을 모았다가 전송 | `X-Accel-Buffering: no`, `proxy_buffering off` |
| 스케일아웃 | 연결이 특정 인스턴스에 고정됨 | Redis Pub/Sub, 외부 메시지 브로커 |
| 커넥션 누수 | 클라이언트 종료를 서버가 알아채지 못함 | 종료·타임아웃·에러 콜백에서 반드시 정리 |
| 재연결 중복 | 재연결 후 같은 이벤트를 다시 수신 | 이벤트 ID 기반 멱등 처리 |

## 마치며

정리하면 이렇습니다.

- HTTP는 무상태·비연결성이라 서버가 먼저 데이터를 보낼 수 없고, 네 방식 모두 이 제약을 다르게 해결합니다.
- 폴링은 주기적 재요청입니다. 지연과 요청 수가 반비례해서 둘 다 만족시킬 수 없습니다.
- 롱 폴링은 응답을 보류해 빈 응답을 없앱니다. WebSocket을 쓸 수 없는 환경의 대안에 가깝습니다.
- SSE는 HTTP 위의 표준 단방향 푸시입니다. 자동 재연결과 <Term id="last-event-id">Last-Event-ID</Term> 복구를 브라우저가 제공합니다.
- WebSocket은 프로토콜을 전환해 양방향 회선을 엽니다. 성능은 가장 좋지만 재연결, 스케일아웃, 인증을 모두 직접 설계해야 합니다.
- 선택 순서는 통신 방향 → 실시간성 요구 → 인프라 제약입니다. 양방향이 아니면 WebSocket을 먼저 고려할 이유가 없습니다.
- 동시 사용자 수를 함께 세어 봅니다. 폴링은 사용자 수와 갱신 요소 수가 곱해지지만, 연결 유지 방식은 커넥션만 늘고 서버 조회는 한 번으로 공유됩니다. 이 손익분기가 어디 있느냐에 따라 같은 요구사항의 답이 바뀝니다.
- 갱신 주기의 폭도 봅니다. 몇 초에서 몇 시간까지 벌어지는 화면이라면 연결을 유지해서 얻을 게 적습니다. 연결 유지는 데이터가 자주 오는 화면에 맞는 도구입니다.

그리고 "실시간 화면"이라는 한 단어로 묶인 요구사항이라도, 갱신 주기의 폭과 장애 시 파급 범위, 처리량, 만드는 비용을 따로 따져 보면 답이 갈릴 수 있습니다. 제 경우에는 같은 대시보드 안에서 갈렸습니다.

다음 글에서는 SSE를 실제로 운영하면서 부딪힌 문제들을 다룹니다. 중복 전송을 걸러 내는 방법, 여러 스레드에서 밀어 보낼 때 생기는 전송 순서 역전, 느린 클라이언트가 전체를 막지 않게 격리하는 방법 같은 것들입니다.

> 참고: [실시간 통신 기술 정리 (jay-ya.tistory.com)](https://jay-ya.tistory.com/160), [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), [RFC 6455 — The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
