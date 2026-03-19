---
title: "JavaScript 비동기 처리 - 콜백에서 async/await까지"
date: "2026-03-20"
description: "JavaScript 비동기 처리의 진화 과정을 정리합니다. 콜백 함수의 한계부터 Promise, async/await까지 단계별로 다룹니다."
category: "개발"
subcategory: "JavaScript"
tags: ["guide", "beginner"]
thumbnail: "/images/thumbnails/javascript"
series: "javascript-core"
seriesOrder: 3
relatedSlugs:
  - "javascript-closure"
  - "javascript-this-binding"
glossary:
  - id: "callback"
    term: "콜백 함수(Callback)"
    brief: "다른 함수에 인자로 전달되어 나중에 실행되는 함수"
    detail: "함수를 다른 함수의 인자로 넘기고, 특정 시점에 호출되도록 하는 패턴이다. 비동기 작업의 완료 시점에 실행할 로직을 전달하는 데 주로 사용된다."
  - id: "promise"
    term: "Promise"
    brief: "비동기 작업의 완료 또는 실패를 나타내는 객체"
    detail: "비동기 연산의 최종 결과를 대리하는 객체로, pending(대기), fulfilled(이행), rejected(거부) 세 가지 상태를 가진다. then, catch, finally 메서드로 결과를 처리한다."
  - id: "async-await"
    term: "async/await"
    brief: "Promise를 동기 코드처럼 작성할 수 있게 해주는 문법"
    detail: "ES2017에서 도입된 문법으로, async 함수 내에서 await 키워드를 사용해 Promise의 처리를 기다릴 수 있다. Promise 체이닝보다 가독성이 높고 에러 처리가 직관적이다."
  - id: "event-loop"
    term: "이벤트 루프(Event Loop)"
    brief: "콜 스택이 비어있을 때 태스크 큐의 작업을 실행하는 메커니즘"
    detail: "JavaScript 런타임이 비동기 작업을 처리하는 핵심 메커니즘이다. 콜 스택, 마이크로태스크 큐, 매크로태스크 큐로 구성되며, 싱글 스레드 환경에서 비동기 처리를 가능하게 한다."
  - id: "microtask"
    term: "마이크로태스크(Microtask)"
    brief: "매크로태스크보다 우선 실행되는 작업 큐"
    detail: "Promise.then, queueMicrotask 등이 마이크로태스크 큐에 등록된다. 콜 스택이 비면 매크로태스크(setTimeout 등)보다 먼저 실행되며, 큐가 비워질 때까지 모두 처리된다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-async/javascript-async-light.png" alt="JavaScript 비동기 처리" />
      <img className="theme-dark" src="/images/posts/javascript-async/javascript-async-dark.png" alt="JavaScript 비동기 처리" />
    </div>
  </div>
</figure>

## 비동기란 무엇인가

파스타를 먹고 싶을 때, 두 가지 방법이 있습니다.

**동기(Synchronous) 방식** — 직접 파스타를 만드는 상황입니다.
면을 삶고, 재료를 손질하고, 소스를 끓여야 합니다.
각 단계가 끝나야 다음으로 넘어갈 수 있고, 완성될 때까지 주방을 떠날 수 없습니다.

**비동기(Asynchronous) 방식** — 배달앱으로 파스타를 주문하는 상황입니다.
주문 버튼을 누르면 끝입니다.
파스타가 도착할 때까지 TV를 보거나 게임을 하는 등 다른 일을 할 수 있습니다.
도착 알림이 울리면 그때 문 앞에서 받으면 됩니다.

| 구분 | 동기 (Synchronous) | 비동기 (Asynchronous) |
|------|-------------------|----------------------|
| 실행 순서 | 순차적, 블로킹 | 비순차적, 논블로킹 |
| 대기 | 완료까지 대기 | 다른 작업 진행 가능 |
| 사용 사례 | 계산, 데이터 처리 | 네트워크 요청, 타이머, 파일 읽기 |

JavaScript는 **싱글 스레드** 언어입니다.
한 번에 하나의 작업만 처리할 수 있다는 뜻입니다.
만약 서버에서 데이터를 가져오는 데 3초가 걸리는 작업을 동기로 처리하면, 그 3초 동안 화면은 완전히 멈춥니다.
버튼 클릭도, 스크롤도, 입력도 전부 불가능합니다.

이 문제를 해결하기 위해 JavaScript는 **비동기 처리**를 사용합니다.
시간이 오래 걸리는 작업은 브라우저에 맡기고, 결과가 준비되면 그때 처리하는 방식입니다.

```javascript
console.log('1번');

setTimeout(() => {
    console.log('2번 (1초 후)');
}, 1000);

console.log('3번');

// 출력 순서:
// 1번
// 3번
// 2번 (1초 후)
```

`setTimeout`은 비동기 함수입니다.
1초를 기다리는 동안 JavaScript는 멈추지 않고 다음 줄(`3번`)을 먼저 실행합니다.
1초가 지나면 그제서야 `2번`이 출력됩니다.

## 콜백 함수

비동기 작업이 끝났을 때 "이걸 실행해줘"라고 넘겨주는 함수를 <Term id="callback">콜백(Callback)</Term>이라고 합니다.

배달 주문을 하면서 "도착하면 문 앞에 놓아주세요"라고 메모를 남기는 것과 비슷합니다.
배달이 언제 도착할지 모르지만, 도착했을 때 무엇을 할지 미리 정해두는 것입니다.

```javascript
// "1초 후에 이 함수를 실행해줘" → 콜백
setTimeout(function() {
    console.log('1초 후 실행');
}, 1000);

// "버튼이 클릭되면 이 함수를 실행해줘" → 콜백
button.addEventListener('click', function() {
    console.log('클릭됨');
});
```

서버에서 데이터를 가져오는 상황에서도 콜백이 사용됩니다.

```javascript
function getUser(userId, callback) {
    // 서버에 요청 (시간이 걸리는 작업)
    setTimeout(() => {
        const user = { id: userId, name: '홍길동' };
        callback(user);  // 데이터가 준비되면 콜백 실행
    }, 1000);
}

getUser(1, function(user) {
    console.log('유저:', user.name);  // '홍길동'
});
```

`getUser` 함수는 데이터가 준비되는 데 1초가 걸리지만, 결과가 나오면 전달받은 콜백 함수를 호출합니다.

## 콜백 지옥

콜백이 하나일 때는 간단하지만, 여러 비동기 작업을 순서대로 처리해야 하면 문제가 생깁니다.

유저 정보를 가져오고 → 그 유저의 게시물을 가져오고 → 그 게시물의 댓글을 가져오는 상황을 봅시다.

```javascript
getUser(userId, function(user) {
    getPosts(user.id, function(posts) {
        getComments(posts[0].id, function(comments) {
            getLikes(comments[0].id, function(likes) {
                console.log('좋아요:', likes);
                // 더 깊어질 수 있음...
            }, function(error) {
                console.error('좋아요 조회 실패:', error);
            });
        }, function(error) {
            console.error('댓글 조회 실패:', error);
        });
    }, function(error) {
        console.error('게시물 조회 실패:', error);
    });
}, function(error) {
    console.error('유저 조회 실패:', error);
});
```

코드가 오른쪽으로 계속 밀려나는 피라미드 모양이 됩니다.
이것을 **콜백 지옥(Callback Hell)**이라고 합니다.

| 문제 | 설명 |
|------|------|
| 가독성 저하 | 깊은 중첩으로 코드 흐름 파악이 어려움 |
| 에러 처리 복잡 | 각 단계마다 에러 콜백을 따로 전달해야 함 |
| 유지보수 어려움 | 중간 단계를 수정하면 전체 구조가 흔들림 |

이 문제를 해결하기 위해 **Promise**가 등장했습니다.

## Promise

<Term id="promise">Promise</Term>는 "비동기 작업의 약속"입니다.

레스토랑에서 대기표를 받는 것과 비슷합니다.
대기표(Promise)를 받으면 세 가지 상태 중 하나가 됩니다.

- **pending**(대기 중) — 아직 자리가 안 났음
- **fulfilled**(이행됨) — 자리가 나서 입장 가능
- **rejected**(거부됨) — 오늘은 자리가 안 나서 입장 불가

한번 fulfilled나 rejected가 되면 상태가 바뀌지 않습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-async/promise-flow-light.png" alt="Promise 상태 흐름도" />
      <img className="theme-dark" src="/images/posts/javascript-async/promise-flow-dark.png" alt="Promise 상태 흐름도" />
    </div>
    <figcaption>그림 1. Promise 상태 흐름 — Pending에서 Fulfilled 또는 Rejected로 전환</figcaption>
  </div>
</figure>

### Promise 만들기

```javascript
const promise = new Promise((resolve, reject) => {
    // 비동기 작업 수행
    const success = true;

    if (success) {
        resolve('성공 결과');  // fulfilled 상태로 전환
    } else {
        reject('실패 이유');   // rejected 상태로 전환
    }
});
```

`new Promise`에 전달하는 함수는 두 개의 인자를 받습니다.
- `resolve` — 성공했을 때 호출
- `reject` — 실패했을 때 호출

### Promise 사용하기: then, catch, finally

Promise의 결과를 처리하는 세 가지 메서드가 있습니다.

```javascript
promise
    .then((result) => {
        console.log('성공:', result);  // resolve된 값
    })
    .catch((error) => {
        console.log('실패:', error);   // reject된 값
    })
    .finally(() => {
        console.log('완료');  // 성공이든 실패든 항상 실행
    });
```

| 메서드 | 실행 시점 | 용도 |
|--------|----------|------|
| `then` | Promise가 성공했을 때 | 결과값 처리 |
| `catch` | Promise가 실패했을 때 | 에러 처리 |
| `finally` | 성공이든 실패든 항상 | 로딩 상태 해제 등 정리 작업 |

### 체이닝으로 콜백 지옥 해결하기

`then`은 새로운 Promise를 반환합니다. 이 덕분에 체이닝이 가능합니다.

콜백 지옥이었던 코드가 이렇게 바뀝니다.

```javascript
// 콜백 지옥 → Promise 체이닝
getUser(userId)
    .then(user => getPosts(user.id))
    .then(posts => getComments(posts[0].id))
    .then(comments => getLikes(comments[0].id))
    .then(likes => console.log('좋아요:', likes))
    .catch(error => console.error('에러:', error));
```

피라미드가 사라지고, 위에서 아래로 자연스럽게 읽히는 코드가 되었습니다.
에러 처리도 마지막 `catch` 하나로 모든 단계의 에러를 잡을 수 있습니다.

### 실전 예시: 서버에서 데이터 가져오기

콜백 방식의 함수를 Promise로 감싸는 방법을 봅시다.

```javascript
// 콜백 방식
function getUserCallback(userId, callback) {
    setTimeout(() => {
        callback({ id: userId, name: '홍길동' });
    }, 1000);
}

// Promise 방식으로 변환
function getUser(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = { id: userId, name: '홍길동' };
            if (user) {
                resolve(user);
            } else {
                reject(new Error('유저를 찾을 수 없습니다'));
            }
        }, 1000);
    });
}

// 사용
getUser(1)
    .then(user => console.log('유저:', user.name))
    .catch(error => console.error('에러:', error.message));
```

### 여러 Promise 동시에 처리하기

독립적인 비동기 작업을 동시에 실행하고, 모든 결과를 한꺼번에 받을 수 있습니다.

```javascript
// Promise.all — 모두 성공해야 결과를 받음
const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
]);
```

| 메서드 | 동작 | 실패 시 |
|--------|------|---------|
| `Promise.all` | 모두 성공하면 결과 배열 반환 | 하나라도 실패하면 즉시 reject |
| `Promise.allSettled` | 모두 완료될 때까지 대기 | 성공/실패 결과를 모두 반환 |
| `Promise.race` | 가장 먼저 처리된 결과 반환 | 가장 빠른 것이 실패면 reject |
| `Promise.any` | 가장 먼저 성공한 결과 반환 | 모두 실패해야 reject |

`Promise.allSettled`는 일부가 실패해도 나머지 결과를 받고 싶을 때 유용합니다.

```javascript
const results = await Promise.allSettled([
    fetch('/api/users'),
    fetch('/api/posts'),
    fetch('/api/invalid')  // 이것이 실패해도
]);

results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
        console.log(`요청 ${index}: 성공`);
    } else {
        console.log(`요청 ${index}: 실패 - ${result.reason}`);
    }
});
```

## async/await

Promise 체이닝은 콜백 지옥보다 훨씬 낫지만, 체인이 길어지면 여전히 복잡해질 수 있습니다.
<Term id="async-await">async/await</Term>는 Promise를 **동기 코드처럼** 작성할 수 있게 해주는 문법입니다.

### 기본 사용법

```javascript
// Promise 체이닝
getUser(userId)
    .then(user => getPosts(user.id))
    .then(posts => console.log(posts))
    .catch(error => console.error(error));

// async/await — 같은 동작을 동기 코드처럼
async function loadPosts() {
    try {
        const user = await getUser(userId);
        const posts = await getPosts(user.id);
        console.log(posts);
    } catch (error) {
        console.error(error);
    }
}
```

`async` 키워드를 함수 앞에 붙이면, 그 안에서 `await`를 사용할 수 있습니다.
`await`는 Promise가 처리될 때까지 기다린 뒤, 결과값을 반환합니다.

위에서 아래로 읽으면 되니까, 동기 코드와 똑같은 흐름으로 이해할 수 있습니다.

### async 함수는 항상 Promise를 반환한다

```javascript
async function getData() {
    return '데이터';
}

// 위 코드는 아래와 동일합니다
function getData() {
    return Promise.resolve('데이터');
}

getData().then(data => console.log(data));  // '데이터'
```

값을 반환하면 자동으로 `Promise.resolve()`로 감싸지고, 에러를 던지면 `Promise.reject()`로 감싸집니다.

### 에러 처리: try/catch

Promise의 `.catch()` 대신 익숙한 `try/catch` 문법을 사용합니다.

```javascript
async function fetchData() {
    try {
        const response = await fetch('/api/data');

        if (!response.ok) {
            throw new Error(`HTTP 에러: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('에러 발생:', error.message);
        throw error;
    }
}
```

여러 `await`가 있어도 `catch` 블록 하나로 모든 에러를 처리할 수 있습니다.

```javascript
async function processData() {
    try {
        const user = await fetchUser();        // 여기서 에러가 나면
        const posts = await fetchPosts(user.id);  // 여기서 에러가 나면
        const comments = await fetchComments(posts[0].id);  // 여기서 에러가 나면
        return { user, posts, comments };
    } catch (error) {
        // 어느 줄에서 에러가 나든 여기로 옴
        console.error('데이터 처리 실패:', error);
        return null;
    }
}
```

### 세 가지 스타일 비교

같은 로직을 콜백, Promise, async/await로 각각 작성해 보겠습니다.

```javascript
// 1. 콜백 — 중첩이 깊어진다
getUser(userId, function(user) {
    getPosts(user.id, function(posts) {
        getComments(posts[0].id, function(comments) {
            console.log(comments);
        });
    });
});

// 2. Promise — 체이닝으로 평탄하게
getUser(userId)
    .then(user => getPosts(user.id))
    .then(posts => getComments(posts[0].id))
    .then(comments => console.log(comments))
    .catch(error => console.error(error));

// 3. async/await — 동기 코드처럼
async function load() {
    const user = await getUser(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    console.log(comments);
}
```

<div className="info-box">
  <strong>어떤 방식을 선택해야 할까?</strong><br/>
  실무에서는 <strong>async/await</strong>를 기본으로 사용합니다.
  가독성이 가장 좋고, 에러 처리가 직관적이기 때문입니다.
  다만 async/await도 내부적으로 Promise를 사용하므로, Promise의 동작 원리를 이해하고 있어야 합니다.
</div>

## 순차 실행과 병렬 실행

async/await를 사용할 때 가장 흔한 실수는 **불필요한 순차 실행**입니다.

### 순차 실행: 하나씩 기다리기

```javascript
async function sequential() {
    const user1 = await fetchUser(1);  // 1초 대기
    const user2 = await fetchUser(2);  // 1초 대기
    const user3 = await fetchUser(3);  // 1초 대기
    // 총 3초 소요
}
```

세 요청이 서로 관련이 없는데도, 하나가 끝나야 다음을 시작합니다.

### 병렬 실행: 동시에 시작하기

```javascript
async function parallel() {
    const [user1, user2, user3] = await Promise.all([
        fetchUser(1),  // 동시에 시작
        fetchUser(2),  // 동시에 시작
        fetchUser(3)   // 동시에 시작
    ]);
    // 총 1초 소요 (가장 오래 걸리는 요청만큼)
}
```

`Promise.all`을 사용하면 독립적인 요청을 동시에 보낼 수 있습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-async/parallel-light.png" alt="순차 실행 vs 병렬 실행 비교" />
      <img className="theme-dark" src="/images/posts/javascript-async/parallel-dark.png" alt="순차 실행 vs 병렬 실행 비교" />
    </div>
    <figcaption>그림 2. 순차 실행(3초) vs 병렬 실행(1초) — Promise.all로 시간을 절약</figcaption>
  </div>
</figure>

### 언제 순차, 언제 병렬?

| 상황 | 방식 | 이유 |
|------|------|------|
| 요청 간 의존성이 없을 때 | `Promise.all` (병렬) | 시간 절약 |
| 이전 결과가 다음 요청에 필요할 때 | `await` 순차 | 의존성 존재 |
| 혼합 (일부 의존, 일부 독립) | 의존성 부분만 순차, 나머지 병렬 | 최적화 |

의존성이 있는 경우의 예시를 봅시다.

```javascript
async function fetchUserData(userId) {
    // 1단계: 유저 정보 먼저 (필수)
    const user = await fetchUser(userId);

    // 2단계: 유저 정보를 바탕으로 병렬 조회
    const [posts, followers] = await Promise.all([
        fetchPosts(user.id),
        fetchFollowers(user.id)
    ]);

    return { user, posts, followers };
}
```

유저 정보를 먼저 가져온 뒤, 게시물과 팔로워는 동시에 가져오는 방식입니다.

## 반복문에서의 async/await

배열의 각 항목에 대해 비동기 작업을 해야 할 때, 반복문 선택에 주의가 필요합니다.

### for...of: 순차 실행

```javascript
async function processSequentially(items) {
    for (const item of items) {
        await processItem(item);  // 하나씩 순서대로
    }
}
```

### forEach는 await를 기다리지 않는다

```javascript
// ❌ forEach는 async 콜백을 기다리지 않음
async function wrongWay(items) {
    items.forEach(async (item) => {
        await processItem(item);
    });
    console.log('완료');  // processItem이 끝나기 전에 출력됨!
}

// ✅ for...of 사용
async function rightWay(items) {
    for (const item of items) {
        await processItem(item);
    }
    console.log('완료');  // 모든 처리가 끝난 후 출력
}
```

<div className="warning-box">
  <strong>주의</strong><br/>
  <code>forEach</code>는 콜백의 반환값을 무시합니다.
  async 콜백을 전달해도 Promise를 기다리지 않고 다음 반복으로 넘어갑니다.
  비동기 반복에는 <code>for...of</code> 또는 <code>map + Promise.all</code>을 사용합니다.
</div>

### map + Promise.all: 병렬 실행

```javascript
async function processParallel(items) {
    const results = await Promise.all(
        items.map(item => processItem(item))
    );
    return results;
}
```

## 이벤트 루프

지금까지 비동기 코드의 작성법을 살펴봤습니다.
그렇다면 싱글 스레드인 JavaScript가 어떻게 비동기를 처리할 수 있는 걸까요?

그 비밀은 <Term id="event-loop">이벤트 루프(Event Loop)</Term>에 있습니다.

교통 정리를 하는 교차로를 떠올려 봅시다.
- **콜 스택(Call Stack)** — 현재 달리고 있는 차(실행 중인 코드)
- **마이크로태스크 큐** — 우선 신호를 받은 긴급 차량(Promise.then 등)
- **매크로태스크 큐** — 일반 대기 차량(setTimeout 등)
- **이벤트 루프** — 교통 경찰 (콜 스택이 비면 다음 차를 보냄)

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-async/eventloop-light.png" alt="이벤트 루프 구조" />
      <img className="theme-dark" src="/images/posts/javascript-async/eventloop-dark.png" alt="이벤트 루프 구조" />
    </div>
    <figcaption>그림 3. 이벤트 루프 — 콜 스택이 비면 마이크로태스크를 먼저, 매크로태스크를 나중에 처리</figcaption>
  </div>
</figure>

동작 순서는 이렇습니다.
1. 콜 스택의 모든 코드를 실행합니다.
2. 콜 스택이 비면, <Term id="microtask">마이크로태스크</Term> 큐를 **전부** 비울 때까지 실행합니다.
3. 마이크로태스크 큐가 비면, 매크로태스크 큐에서 **하나**를 꺼내 실행합니다.
4. 1번으로 돌아가서 반복합니다.

### 실행 순서 예측해보기

```javascript
console.log('1');

setTimeout(() => {
    console.log('2');
}, 0);

Promise.resolve().then(() => {
    console.log('3');
});

console.log('4');
```

<details>
<summary>정답 확인</summary>

출력 순서: **1 → 4 → 3 → 2**

<div className="info-box">
  <strong>단계별 해설</strong><br/>
  1. <code>console.log('1')</code> → 동기 코드, 즉시 실행 → <strong>1 출력</strong><br/>
  2. <code>setTimeout</code> → 매크로태스크 큐에 등록 (나중에)<br/>
  3. <code>Promise.then</code> → 마이크로태스크 큐에 등록 (우선)<br/>
  4. <code>console.log('4')</code> → 동기 코드, 즉시 실행 → <strong>4 출력</strong><br/>
  5. 콜 스택 비어있음 → 마이크로태스크 실행 → <strong>3 출력</strong><br/>
  6. 마이크로태스크 큐 비어있음 → 매크로태스크 실행 → <strong>2 출력</strong>
</div>

</details>

`setTimeout`의 지연 시간이 0ms여도 마이크로태스크인 `Promise.then`보다 늦게 실행됩니다.
이벤트 루프의 **우선순위 규칙** 때문입니다.

| 구분 | 마이크로태스크 | 매크로태스크 |
|------|---------------|--------------|
| 예시 | Promise.then, await 이후 코드, queueMicrotask | setTimeout, setInterval, DOM 이벤트 |
| 우선순위 | **높음** (먼저 실행) | 낮음 (나중 실행) |
| 실행 방식 | 큐가 빌 때까지 **모두** 실행 | 한 번에 **하나만** 실행 |

## 정리

JavaScript의 비동기 처리는 콜백 → Promise → async/await 순서로 발전해왔습니다.

| 방식 | 장점 | 단점 |
|------|------|------|
| 콜백 | 단순하고 직관적 | 중첩 시 콜백 지옥, 에러 처리 복잡 |
| Promise | 체이닝으로 가독성 향상, 에러 처리 통합 | 체인이 길면 복잡해질 수 있음 |
| async/await | 동기 코드처럼 읽힘, try/catch 에러 처리 | async 함수 안에서만 사용 가능 |

```text
콜백 (1995~)
  └→ Promise (ES6, 2015)
       └→ async/await (ES2017)
```

세 방식은 대체 관계가 아니라 **발전 관계**입니다.
async/await도 내부적으로 Promise를 사용하고, Promise도 내부적으로 콜백 메커니즘을 사용합니다.
그래서 Promise의 동작 원리를 이해해야 async/await를 제대로 활용할 수 있습니다.

실무에서의 권장 사항을 정리하면 이렇습니다.

- **기본**: async/await를 사용합니다
- **병렬 처리**: `Promise.all`을 활용합니다
- **에러 처리**: try/catch를 빠뜨리지 않습니다
- **반복문**: `forEach` 대신 `for...of` 또는 `map + Promise.all`을 사용합니다

[이전 글](/blog/javascript-closure)에서 클로저가 함수의 "기억"이고, [this 바인딩](/blog/javascript-this-binding)이 함수의 "맥락"이었다면, 비동기 처리는 함수의 **"시간"**을 다루는 방법입니다.
세 가지를 함께 이해하면 JavaScript 함수의 동작 방식이 훨씬 명확해집니다.
