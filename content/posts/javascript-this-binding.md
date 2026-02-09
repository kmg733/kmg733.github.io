---
title: "JavaScript this 바인딩 - 호출이 결정하는 것들"
date: "2026-02-09"
description: "JavaScript에서 this가 결정되는 규칙을 호출 방식별로 정리합니다. 일반 함수, 메서드, 생성자, 명시적 바인딩, 화살표 함수까지 실전 코드와 함께 다룹니다."
category: "개발"
subcategory: "JavaScript"
tags: ["guide", "intermediate"]
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-this-binding/javascript-this-binding-light.png" alt="JavaScript this 바인딩" />
      <img className="theme-dark" src="/images/posts/javascript-this-binding/javascript-this-binding-dark.png" alt="JavaScript this 바인딩" />
    </div>
    <figcaption>그림 1. JavaScript this 바인딩</figcaption>
  </div>
</figure>

## this란 무엇인가

JavaScript를 사용하다 보면 `this`가 예상과 다른 값을 가리키는 상황을 자주 접하게 됩니다.
다른 언어에서 `this`는 항상 "자기 자신(인스턴스)"을 의미하지만, JavaScript의 `this`는 **함수가 어떻게 호출되었는지**에 따라 달라집니다.

[이전 클로저 글](/blog/javascript-closure#this-바인딩과-클로저)에서 화살표 함수가 외부 `this`를 클로저처럼 캡처한다는 점을 잠깐 다루었습니다.
이번 글에서는 `this`가 결정되는 다섯 가지 규칙을 하나씩 살펴보겠습니다.

<div className="info-box">
  <strong>핵심 원칙</strong><br/>
  JavaScript의 this는 <strong>선언 시점</strong>이 아니라 <strong>호출 시점</strong>에 결정됩니다.
  같은 함수라도 호출 방식이 다르면 this가 가리키는 대상이 달라집니다.
  (유일한 예외는 화살표 함수입니다.)
</div>

| 호출 방식 | this 값 | 예시 |
|----------|---------|------|
| 일반 함수 호출 | 전역 객체 (strict: `undefined`) | `func()` |
| 메서드 호출 | 점(.) 앞의 객체 | `obj.method()` |
| 생성자 호출 | 새로 생성된 인스턴스 | `new Func()` |
| call/apply/bind | 명시적으로 지정한 객체 | `func.call(obj)` |
| 화살표 함수 | 상위 스코프의 this (고정) | `() => {}` |

<details>
<summary>용어 설명: 바인딩(Binding)이란</summary>

<strong>바인딩(Binding)</strong>이란 식별자(변수명, 함수명 등)와 실제 값을 연결하는 것을 말합니다.
"this 바인딩"은 <strong>this 키워드가 어떤 객체를 가리킬지 연결(결정)하는 과정</strong>을 의미합니다.

일반 변수는 선언 시점에 스코프가 결정되지만, this는 호출 시점에 바인딩이 결정됩니다.
이 "동적 바인딩"이 JavaScript this의 핵심이자 혼란의 원인입니다.

</details>

### this vs 스코프 체인

변수를 찾을 때는 스코프 체인을 따라 현재 → 부모 → 전역 순서로 탐색합니다.
하지만 `this`는 이런 탐색 과정이 **없습니다**. 호출 방식에 따라 곧바로 결정됩니다.

| 구분 | 변수 참조 | this |
|------|----------|------|
| 탐색 방식 | 스코프 체인을 따라 탐색 | **탐색 없음** |
| 결정 시점 | 선언 시점 (렉시컬) | 호출 시점 (동적) |
| 탐색 범위 | 현재 → 부모 → ... → 전역 | 호출 방식에 따라 즉시 결정 |

```javascript
const obj = {
    name: 'obj',
    outer: function() {
        console.log(this.name);  // 'obj' ← obj.outer()로 호출

        function inner() {
            console.log(this.name);  // undefined ← inner()로 호출
        }
        inner();
    }
};
obj.outer();
```

`inner()`는 `outer` 내부에서 호출되었지만, `this`는 부모 스코프를 탐색하지 않습니다.
점(.) 없이 단독으로 호출되었으므로, `this`는 전역 객체(strict mode에서는 `undefined`)가 됩니다.

## 바인딩 규칙 1: 일반 함수 호출

함수를 아무 접두사 없이 단독으로 호출하면, `this`는 전역 객체를 가리킵니다.

### 기본 동작

```javascript
function showThis() {
    console.log(this);
}

showThis();  // window (브라우저) / global (Node.js)
```

가장 단순한 규칙이지만, 의도치 않은 전역 오염의 원인이 됩니다.

### strict mode에서의 차이

`'use strict'`는 JavaScript의 엄격 모드를 활성화하는 지시어입니다.
strict mode에서는 일반 함수의 `this`가 전역 객체 대신 `undefined`가 되어, 실수를 조기에 발견할 수 있습니다.

```javascript
// 비strict mode - 전역 오염 발생
function createUser(name) {
    this.name = name;  // window.name = name (의도하지 않은 동작)
}
createUser('Kim');
console.log(window.name);  // 'Kim' ← 전역 오염
```

```javascript
// strict mode - 버그 조기 발견
'use strict';
function createUser(name) {
    this.name = name;  // TypeError: Cannot set properties of undefined
}
createUser('Kim');  // 에러 발생 → 실수를 바로 알 수 있음
```

| 모드 | this 값 | 결과 |
|------|---------|------|
| 비strict | 전역 객체 | 실수가 조용히 전역 오염 |
| strict | `undefined` | 에러 발생 → 버그 조기 발견 |

<div className="info-box">
  ES6 모듈(<code>import</code>/<code>export</code>)은 자동으로 strict mode가 적용됩니다.
  React, Vue 등 모던 프레임워크에서는 대부분 모듈 시스템을 사용하므로, 일반 함수의 this는 <code>undefined</code>가 기본입니다.
</div>

### 중첩 함수 문제와 해결

메서드 내부에 정의된 일반 함수는 `this`가 메서드의 `this`를 따르지 않습니다.
이것이 `this`와 관련된 가장 흔한 혼란입니다.

```javascript
const obj = {
    value: 100,
    method() {
        console.log(this.value);  // 100 (obj.method() 호출)

        function inner() {
            console.log(this.value);  // undefined (inner() 단독 호출)
        }
        inner();
    }
};
obj.method();
```

`inner()`는 `method` 안에서 호출되었지만, 점(.) 없이 단독 호출되었으므로 `this`는 전역 객체입니다.
이 문제를 해결하는 세 가지 방법이 있습니다.

```javascript
const obj = {
    value: 100,
    method() {
        // 방법 1: that(self) 패턴 - 클로저로 this 저장
        const that = this;
        function inner1() {
            console.log(that.value);  // 100
        }

        // 방법 2: 화살표 함수 (권장)
        const inner2 = () => {
            console.log(this.value);  // 100 (상위 스코프의 this)
        };

        // 방법 3: bind로 명시적 바인딩
        function inner3() {
            console.log(this.value);
        }
        inner3.bind(this)();  // 100

        inner1();
        inner2();
    }
};
obj.method();
```

방법 2의 화살표 함수가 가장 간결하고 현대적인 해결 방법입니다.
화살표 함수의 `this` 동작은 [바인딩 규칙 5](#바인딩-규칙-5-화살표-함수)에서 자세히 다루겠습니다.

## 바인딩 규칙 2: 메서드 호출

### 점(.) 규칙

메서드 호출의 `this` 판단은 간단합니다.
**함수 호출 시 점(.) 앞에 있는 객체가 this**입니다.

```javascript
const user = {
    name: 'Kim',
    greet() {
        console.log(`Hello, ${this.name}`);
    }
};

user.greet();  // Hello, Kim (점 앞의 user가 this)
```

중첩된 객체의 경우, **마지막 점(.) 앞의 객체**가 `this`가 됩니다.

```javascript
obj.method()           // this = obj
obj.inner.method()     // this = obj.inner (마지막 점 앞)
obj['method']()        // this = obj (대괄호도 동일)
method()               // this = 전역 (점이 없음)
```

<div className="info-box">
  <strong>점(.) 규칙 요약</strong><br/>
  점(.) 앞에 객체가 있으면 → 해당 객체가 this<br/>
  점(.) 없이 단독 호출이면 → 전역 객체 (strict: undefined)
</div>

### 메서드 분리 시 this 손실

메서드를 변수에 할당하면 점(.) 관계가 사라지고, `this` 바인딩이 손실됩니다.

```javascript
const user = {
    name: 'Kim',
    greet() {
        console.log(`Hello, ${this.name}`);
    }
};

user.greet();  // Hello, Kim ✅

const greetFunc = user.greet;  // 메서드를 변수에 할당
greetFunc();  // Hello, undefined ❌ (this가 전역)
```

변수에 담긴 시점에서 `greetFunc`은 `user`와의 관계가 끊어진 일반 함수입니다.
`bind`로 `this`를 고정하면 이 문제를 해결할 수 있습니다.

```javascript
const boundGreet = user.greet.bind(user);
boundGreet();  // Hello, Kim ✅
```

### 메서드 체이닝

메서드가 `this`를 반환하면, 연속적으로 메서드를 호출하는 체이닝이 가능합니다.

```javascript
const calculator = {
    value: 0,
    add(n) { this.value += n; return this; },
    subtract(n) { this.value -= n; return this; },
    getResult() { return this.value; }
};

calculator.add(10).subtract(3).add(5).getResult();  // 12
```

각 메서드가 `return this`를 하므로, 점(.) 앞의 객체가 항상 `calculator`로 유지됩니다.

## 바인딩 규칙 3: 생성자 호출

### new 연산자의 동작

`new` 키워드와 함께 함수를 호출하면, JavaScript 엔진이 내부적으로 다음 과정을 수행합니다.

```javascript
function Person(name, age) {
    // 1. 빈 객체 생성 → this에 바인딩
    // 2. this에 프로퍼티 추가
    this.name = name;
    this.age = age;
    // 3. this 암묵적 반환
}

const person = new Person('Kim', 30);
console.log(person.name);  // 'Kim'
```

<div className="info-box">
  <strong>new의 내부 동작</strong><br/>
  1. 빈 객체 <code>{}</code>를 생성합니다.<br/>
  2. 이 객체를 <code>this</code>에 바인딩합니다.<br/>
  3. 함수 본문을 실행합니다 (this에 프로퍼티 추가).<br/>
  4. 명시적 return이 없으면 <code>this</code>를 자동으로 반환합니다.
</div>

### new 없이 호출 시 문제

생성자 함수를 `new` 없이 호출하면, 일반 함수 호출 규칙이 적용되어 전역 오염이 발생합니다.

```javascript
const person = Person('Kim', 30);  // new 없이 호출
console.log(person);        // undefined (return문 없으므로)
console.log(window.name);   // 'Kim' ← 전역 오염
```

### 방어 코드: new.target

ES6의 `new.target`을 사용하면 `new` 없이 호출되었을 때를 감지할 수 있습니다.

```javascript
function SafePerson(name) {
    if (!new.target) {
        return new SafePerson(name);  // new 강제
    }
    this.name = name;
}

SafePerson('Kim').name;        // 'Kim' (자동으로 new 적용)
new SafePerson('Kim').name;    // 'Kim'
```

실무에서는 `class` 문법을 사용하면 `new` 없이 호출 시 자동으로 에러가 발생하므로, 별도의 방어 코드가 필요 없습니다.

## 바인딩 규칙 4: 명시적 바인딩

`call`, `apply`, `bind` 메서드를 사용하면 `this`를 원하는 객체로 직접 지정할 수 있습니다.

### call, apply, bind 비교

| 메서드 | 실행 시점 | 인자 전달 | 반환값 |
|--------|----------|----------|--------|
| `call` | 즉시 실행 | 개별 인자 | 함수 실행 결과 |
| `apply` | 즉시 실행 | 배열 | 함수 실행 결과 |
| `bind` | 나중에 실행 | 개별 인자 | 새 함수 |

```javascript
function greet(greeting, punctuation) {
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const user = { name: 'Kim' };

// call: 인자를 쉼표로 구분
greet.call(user, 'Hello', '!');      // Hello, Kim!

// apply: 인자를 배열로 전달
greet.apply(user, ['Hello', '!']);   // Hello, Kim!

// bind: 새 함수를 반환 (나중에 호출)
const boundGreet = greet.bind(user);
boundGreet('Hello', '!');            // Hello, Kim!
```

<div className="info-box">
  <strong>call vs apply vs bind 기억법</strong><br/>
  <strong>call</strong>: <strong>C</strong>omma로 인자 전달, 즉시 실행<br/>
  <strong>apply</strong>: <strong>A</strong>rray로 인자 전달, 즉시 실행<br/>
  <strong>bind</strong>: <strong>B</strong>ound 함수를 반환, 나중에 실행
</div>

### 실전 활용

```javascript
// 유사 배열 → 진짜 배열 변환 (ES5 시절)
function example() {
    const args = Array.prototype.slice.call(arguments);
    console.log(args);  // [1, 2, 3]
}
example(1, 2, 3);

// ES6에서는 더 간단하게
function example2(...args) {
    console.log(args);  // [1, 2, 3]
}
```

```javascript
// 이벤트 핸들러에서 this 고정
class Button {
    constructor(text) {
        this.text = text;
        // bind로 this를 인스턴스에 고정
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        console.log(`Clicked: ${this.text}`);
    }
}
```

`bind`는 한 번 바인딩하면 이후 `call`이나 `apply`로도 `this`를 변경할 수 없습니다.

## 바인딩 규칙 5: 화살표 함수

화살표 함수는 다른 네 가지 규칙과 근본적으로 다릅니다.
화살표 함수는 **자신만의 this를 갖지 않습니다**. 대신 **선언 시점의 상위 스코프 this**를 그대로 사용합니다.

### 렉시컬 this

```javascript
const obj = {
    value: 100,
    normalFunc() {
        setTimeout(function() {
            console.log(this.value);  // undefined (전역)
        }, 100);
    },
    arrowFunc() {
        setTimeout(() => {
            console.log(this.value);  // 100 (obj)
        }, 100);
    }
};
```

`setTimeout`에 전달된 일반 함수는 콜백으로 단독 호출되므로 `this`가 전역 객체입니다.
반면 화살표 함수는 자신만의 `this`가 없어, 선언된 위치의 `this`(여기서는 `arrowFunc`의 `this`, 즉 `obj`)를 사용합니다.

[이전 클로저 글](/blog/javascript-closure#this-바인딩과-클로저)에서 설명한 것처럼, 화살표 함수의 `this`는 클로저와 유사한 방식으로 외부 `this`를 캡처합니다.

### 화살표 함수가 적합한 경우

| 적합한 사용 | 이유 |
|------------|------|
| 콜백 함수 (map, filter, forEach) | 외부 this를 자연스럽게 유지 |
| 타이머 콜백 (setTimeout, setInterval) | 메서드 내부에서 this 보존 |
| Promise 체인의 then/catch | 외부 컨텍스트 유지 |

### 화살표 함수가 부적합한 경우

```javascript
// ❌ 객체 메서드로 사용 - this가 상위 스코프(전역)를 가리킴
const obj = {
    value: 100,
    getValue: () => this.value  // undefined (전역)
};

// ✅ 축약 메서드 사용
const obj2 = {
    value: 100,
    getValue() { return this.value; }  // 100
};
```

```javascript
// ❌ 생성자로 사용 불가
const Person = (name) => { this.name = name; };
new Person('Kim');  // TypeError: Person is not a constructor
```

```javascript
// ❌ call/apply/bind로 this 변경 불가
const arrow = () => console.log(this);
arrow.call({ name: 'obj' });  // 여전히 상위 스코프의 this
```

<div className="info-box">
  화살표 함수의 this는 한 번 결정되면 어떤 방법으로도 변경할 수 없습니다.
  이것은 의도된 동작이며, 예측 가능한 this를 보장하는 것이 화살표 함수의 핵심 장점입니다.
</div>

화살표 함수의 문법, `arguments` 객체, 암시적 반환 등 더 자세한 내용은 별도의 글에서 다룰 예정입니다.

## 바인딩 우선순위

다섯 가지 규칙이 충돌할 때, 어떤 규칙이 우선하는지 알아야 합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/javascript-this-binding/this-binding-priority-light.svg" alt="this 바인딩 우선순위" />
      <img className="theme-dark" src="/images/posts/javascript-this-binding/this-binding-priority-dark.svg" alt="this 바인딩 우선순위" />
    </div>
    <figcaption>그림 2. this 바인딩 우선순위</figcaption>
  </div>
</figure>

`this`를 판단할 때는 다음 체크리스트를 위에서부터 순서대로 확인합니다.

1. **화살표 함수인가?** → 상위 스코프의 this (변경 불가)
2. **new로 호출했는가?** → 새로 생성된 인스턴스
3. **call/apply/bind를 사용했는가?** → 명시적으로 지정한 객체
4. **메서드로 호출했는가? (점 앞에 객체)** → 점(.) 앞의 객체
5. **그 외** → 전역 객체 (strict mode: `undefined`)

## 흔한 실수와 해결

### 이벤트 핸들러에서 this 손실

```javascript
class App {
    constructor() {
        this.count = 0;
    }

    handleClick() {
        this.count++;  // this가 App 인스턴스가 아닐 수 있음
        console.log(this.count);
    }
}

const app = new App();

// ❌ 메서드를 콜백으로 전달하면 this 손실
document.addEventListener('click', app.handleClick);

// ✅ 해결 방법 1: bind
document.addEventListener('click', app.handleClick.bind(app));

// ✅ 해결 방법 2: 화살표 함수로 감싸기
document.addEventListener('click', () => app.handleClick());
```

### 콜백에서 this 손실

```javascript
class DataProcessor {
    constructor(data) {
        this.data = data;
    }

    process() {
        // ❌ 일반 함수 콜백 - this 손실
        this.data.forEach(function(item) {
            console.log(this.data);  // undefined
        });

        // ✅ 화살표 함수 - this 유지
        this.data.forEach(item => {
            console.log(this.data);  // 정상 접근
        });
    }
}
```

### 클래스에서의 해결 패턴

```javascript
class Counter {
    count = 0;

    constructor() {
        // 방법 1: 생성자에서 bind
        this.increment = this.increment.bind(this);
    }

    increment() { this.count++; }

    // 방법 2: 클래스 필드 + 화살표 함수
    decrement = () => { this.count--; };
}

const counter = new Counter();
const inc = counter.increment;  // bind 되어 있음
const dec = counter.decrement;  // 화살표 함수

inc();  // 정상 동작 (bind)
dec();  // 정상 동작 (화살표 함수)
```

두 방법 모두 메서드를 변수에 할당하거나 콜백으로 전달해도 `this`가 유지됩니다.
React의 클래스 컴포넌트에서도 이 패턴이 널리 사용되었습니다.

## 정리

| 호출 방식 | this 결정 | 기억할 점 |
|----------|----------|----------|
| 일반 함수 `func()` | 전역 객체 | strict mode에서 `undefined` |
| 메서드 `obj.method()` | 점(.) 앞 객체 | 분리하면 바인딩 손실 |
| 생성자 `new Func()` | 새 인스턴스 | `new` 없으면 전역 오염 |
| 명시적 `call/apply/bind` | 지정된 객체 | `bind`는 새 함수 반환 |
| 화살표 함수 `() => {}` | 상위 스코프의 this | 변경 불가, 생성자 불가 |

`this`가 혼란스러운 이유는 다른 언어와 달리 "호출 방식"이 값을 결정하기 때문입니다.
하지만 위 다섯 가지 규칙과 우선순위만 기억하면, 어떤 상황에서든 `this`가 무엇을 가리키는지 판단할 수 있습니다.

실무에서는 화살표 함수와 `bind`를 적절히 활용하여 `this` 관련 문제를 예방하는 것이 가장 효과적입니다.
특히 이벤트 핸들러, 콜백 함수, 타이머 등 `this`가 손실되기 쉬운 상황에서는 화살표 함수를 기본으로 사용하되, 객체 메서드나 프로토타입 메서드에서는 일반 함수를 사용하는 습관을 들이면 대부분의 문제를 피할 수 있습니다.
