---
title: "JavaScript 클로저(Closure) - 함수가 기억하는 것들"
date: "2026-02-05"
description: "JavaScript 클로저의 동작 원리부터 실무 활용 패턴까지 정리합니다. 데이터 은닉, 상태 유지, 모듈 패턴 등 클로저를 활용한 실전 코드를 다룹니다."
category: "개발"
subcategory: "JavaScript"
tags: ["guide", "intermediate"]
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img src="/images/posts/javascript-closure/javascript-closure.png" alt="Hello World!" />
    </div>
    <figcaption>그림 1. Javascript Closure</figcaption>
  </div>
</figure>

## 클로저란 무엇인가

JavaScript를 사용하다 보면 "클로저"라는 단어를 자주 접하게 됩니다.
면접 단골 주제이기도 하고, 실무에서도 의식하지 못한 채 사용하고 있는 경우가 많습니다.

클로저(Closure)는 **함수가 자신이 선언된 렉시컬 환경을 기억하여, 외부 스코프의 변수에 접근할 수 있는 현상**입니다.

<details>
<summary>용어 설명: 렉시컬 스코프와 외부 스코프</summary>

<strong>렉시컬 스코프(Lexical Scope)</strong>란, 함수가 어디서 <strong>호출</strong>되었는지가 아니라 어디서 <strong>작성(선언)</strong>되었는지에 따라 접근할 수 있는 변수의 범위가 결정되는 규칙을 말합니다.

<strong>외부 스코프</strong>는 함수 자신을 감싸고 있는 바깥쪽 함수(또는 전역)의 변수 영역을 의미합니다.
즉 함수 안에 또 다른 함수가 있을 때, 안쪽 함수 입장에서 바깥쪽 함수의 변수 영역이 외부 스코프입니다.

</details>

비유하자면, 회사를 퇴사한 직원이 재직 시절 사용하던 사물함 비밀번호를 여전히 기억하고 있는 것과 비슷합니다.
회사(외부 함수)와의 관계는 끝났지만, 그 안에서 알게 된 정보(변수)에는 여전히 접근할 수 있는 셈입니다.

| 구분 | 설명 |
|------|------|
| 정의 | 함수와 그 함수가 선언된 렉시컬 환경의 조합 |
| 핵심 | 내부 함수가 외부 함수의 변수에 접근 가능 |
| 수명 | 외부 함수 종료 후에도 변수가 메모리에 유지됨 |
| 활용 | 데이터 은닉, 상태 유지, 모듈 패턴 |

가장 기본적인 클로저 예시를 보겠습니다.

```javascript
function outer() {
    const message = 'Hello';  // 외부 함수의 변수

    function inner() {
        console.log(message);  // 외부 변수에 접근
    }

    return inner;  // 내부 함수 반환
}

const closureFunc = outer();  // outer 실행 종료
closureFunc();  // 'Hello' - message가 여전히 접근 가능
```

`outer()` 함수는 이미 실행이 끝났지만, 반환된 `inner` 함수는 여전히 `message` 변수에 접근할 수 있습니다.
일반적이라면 함수 종료와 함께 지역 변수도 사라져야 하지만, `inner`가 `message`를 참조하고 있기 때문에 가비지 컬렉션 대상에서 제외됩니다.
이것이 클로저의 핵심입니다.

## 클로저의 동작 원리

클로저가 어떤 과정을 거쳐 동작하는지 단계별로 살펴보겠습니다.

```
1. outer() 호출
   ┌──────────────────────────────────────┐
   │  outer 실행 컨텍스트                  │
   │  - message = 'Hello'                 │
   │  - inner 함수 정의 (렉시컬 환경 기억) │
   └──────────────────────────────────────┘

2. inner 함수 반환, outer 종료
   - 일반적으로 message는 가비지 컬렉션 대상
   - 하지만 inner가 message를 참조하므로 유지됨

3. closureFunc() 호출
   ┌──────────────────────────────────────┐
   │  inner 실행                           │
   │  - 자신의 렉시컬 환경에서 message 탐색 │
   │  - 클로저를 통해 'Hello' 접근         │
   └──────────────────────────────────────┘
```

핵심은 **렉시컬 스코프**입니다. JavaScript 함수는 어디서 호출되었는지가 아니라, **어디서 선언되었는지**에 따라 상위 스코프가 결정됩니다.
`inner` 함수는 `outer` 내부에서 선언되었으므로, `outer`의 변수 환경을 기억합니다.

## 클로저의 특성

### 각 호출마다 독립적인 클로저가 생성된다

```javascript
function createMultiplier(multiplier) {
    return function (number) {
        return number * multiplier;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

`createMultiplier(2)`와 `createMultiplier(3)`은 각각 독립된 클로저를 생성합니다.
`double`은 `multiplier = 2`를, `triple`은 `multiplier = 3`을 기억하며, 서로 간섭하지 않습니다.

### 변수의 참조를 유지한다 (복사가 아닌 참조)

```javascript
function counter() {
    let count = 0;

    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

const myCounter = counter();
myCounter.increment();  // 1
myCounter.increment();  // 2
myCounter.getCount();   // 2
```

클로저는 `count`의 값을 복사하는 것이 아니라, **변수 자체에 대한 참조**를 유지합니다.
그래서 `increment`로 값을 변경하면 `getCount`에서도 변경된 값이 반환됩니다.

## 클로저 활용 패턴

### 데이터 은닉 (Private 변수)

JavaScript에는 `private` 키워드가 없지만(클래스 `#` 문법 제외), 클로저를 활용하면 외부에서 접근할 수 없는 변수를 만들 수 있습니다.

```javascript
function createBankAccount(initialBalance) {
    let balance = initialBalance;  // private 변수

    return {
        deposit(amount) {
            if (amount > 0) {
                balance += amount;
                return balance;
            }
        },
        withdraw(amount) {
            if (amount > 0 && amount <= balance) {
                balance -= amount;
                return balance;
            }
            return '잔액 부족';
        },
        getBalance() {
            return balance;
        }
    };
}

const account = createBankAccount(1000);
account.deposit(500);          // 1500
account.withdraw(200);         // 1300
console.log(account.balance);  // undefined - 직접 접근 불가
```

`balance` 변수는 반환된 객체의 메서드를 통해서만 접근할 수 있고, 외부에서 직접 수정할 수 없습니다.

### 함수 팩토리

동일한 구조의 함수를 다양한 설정으로 생성할 때 유용합니다.

```javascript
function createValidator(rules) {
    return function (value) {
        return rules.every(rule => rule(value));
    };
}

const isPositiveInteger = createValidator([
    (v) => typeof v === 'number',
    (v) => v > 0,
    (v) => Number.isInteger(v)
]);

isPositiveInteger(5);     // true
isPositiveInteger(-3);    // false
isPositiveInteger(3.14);  // false
```

### 메모이제이션

비용이 큰 연산의 결과를 캐싱하는 패턴입니다. 클로저가 `cache` 객체를 유지합니다.

```javascript
function memoize(fn) {
    const cache = {};

    return function (...args) {
        const key = JSON.stringify(args);

        if (cache[key] === undefined) {
            cache[key] = fn.apply(this, args);
        }

        return cache[key];
    };
}

const expensiveCalc = memoize((n) => {
    console.log('계산 중...');
    return n * n;
});

expensiveCalc(5);  // '계산 중...' 출력, 25 반환
expensiveCalc(5);  // 캐시에서 바로 25 반환 (출력 없음)
```

### 이벤트 핸들러와 상태 유지

프론트엔드에서 이벤트 핸들러에 상태를 유지할 때 클로저를 많이 사용합니다.

```javascript
function createToggle(element) {
    let isActive = false;

    element.addEventListener('click', () => {
        isActive = !isActive;
        element.classList.toggle('active', isActive);
    });

    return {
        getState: () => isActive,
        setState: (state) => {
            isActive = state;
            element.classList.toggle('active', isActive);
        }
    };
}
```

클릭 이벤트 콜백이 `isActive` 변수를 클로저로 기억하기 때문에, 클릭할 때마다 상태가 토글됩니다.

## 클로저와 반복문 - 자주 만나는 함정

클로저를 이해할 때 가장 혼란스러운 부분이 반복문과 함께 사용할 때입니다.

### 문제 상황: var와 클로저

```javascript
for (var i = 0; i < 3; i++) {
    setTimeout(() => {
        console.log(i);  // 3, 3, 3
    }, 100);
}
```

0, 1, 2가 출력될 것 같지만 3, 3, 3이 출력됩니다.
`var`는 함수 스코프이기 때문에 세 개의 콜백이 **같은 `i` 변수**를 참조합니다.
`setTimeout` 콜백이 실행되는 시점에는 이미 반복문이 끝나 `i`가 3이 된 상태입니다.

### 해결 방법 1: let 사용

```javascript
for (let i = 0; i < 3; i++) {
    setTimeout(() => {
        console.log(i);  // 0, 1, 2
    }, 100);
}
```

`let`은 블록 스코프이므로, 각 반복마다 새로운 `i`가 생성됩니다.
가장 간단하고 현대적인 해결 방법입니다.

### 해결 방법 2: IIFE로 클로저 생성

```javascript
for (var i = 0; i < 3; i++) {
    (function (capturedI) {
        setTimeout(() => {
            console.log(capturedI);  // 0, 1, 2
        }, 100);
    })(i);
}
```

즉시 실행 함수(IIFE)가 각 반복의 `i` 값을 `capturedI`로 캡처합니다.
`let`이 없던 ES5 시절에 주로 사용하던 방식입니다.

## 모듈 패턴

클로저의 가장 실용적인 활용 중 하나가 모듈 패턴입니다.
IIFE와 클로저를 결합하여 private 영역과 public API를 분리합니다.

```javascript
const Calculator = (function () {
    // private
    let result = 0;

    function validate(n) {
        return typeof n === 'number' && !isNaN(n);
    }

    // public API
    return {
        add(n) {
            if (validate(n)) result += n;
            return this;
        },
        subtract(n) {
            if (validate(n)) result -= n;
            return this;
        },
        getResult() {
            return result;
        },
        reset() {
            result = 0;
            return this;
        }
    };
})();

Calculator.add(10).subtract(3).getResult();  // 7
Calculator.result;    // undefined - private
Calculator.validate;  // undefined - private
```

`result`와 `validate`은 외부에서 접근할 수 없고, 반환된 메서드를 통해서만 사용할 수 있습니다.
ES6 모듈이 보편화되기 전까지 JavaScript에서 모듈을 구현하는 표준적인 방법이었습니다.

## 클로저와 메모리

클로저는 외부 변수에 대한 참조를 유지하므로, 메모리 관리에 주의가 필요합니다.

### 불필요한 참조 주의

```javascript
// 주의: largeData가 계속 메모리에 유지됨
function createHeavyClosure() {
    const largeData = new Array(1000000).fill('data');

    return function () {
        console.log('closure called');
    };
}

// 개선: 필요한 데이터만 캡처
function createLightClosure() {
    const largeData = new Array(1000000).fill('data');
    const dataLength = largeData.length;  // 필요한 값만 추출

    return function () {
        console.log('length:', dataLength);
    };
}
```

첫 번째 함수에서는 반환된 함수가 `largeData`를 직접 사용하지 않더라도, 같은 스코프에 있기 때문에 참조가 유지될 수 있습니다.
필요한 값만 별도 변수로 추출하면 원본 데이터가 가비지 컬렉션 대상이 됩니다.

### 명시적 정리

장기간 유지되는 클로저라면 정리 메서드를 제공하는 것도 방법입니다.

```javascript
function createResource() {
    const resource = { data: 'important' };

    return {
        getData() {
            return resource.data;
        },
        dispose() {
            resource.data = null;
        }
    };
}

const res = createResource();
res.getData();  // 사용
res.dispose();  // 정리
```

## this 바인딩과 클로저

클로저를 사용할 때 `this`와 관련된 혼동이 생기기 쉽습니다.

```javascript
const obj = {
    value: 100,
    getValue: function () {
        // 일반 함수: this가 호출 시점에 결정됨
        return function () {
            return this.value;  // undefined (this가 전역)
        };
    },
    getValueArrow: function () {
        // 화살표 함수: 선언 시점의 this를 클로저로 캡처
        return () => {
            return this.value;  // 100 (obj의 this)
        };
    }
};
```

일반 함수는 자신만의 `this`를 가지지만, 화살표 함수는 `this`가 없어서 외부 `this`를 클로저처럼 캡처합니다.
이벤트 핸들러나 콜백에서 `this`를 유지해야 할 때 화살표 함수가 편리한 이유가 여기에 있습니다.

## 정리

| 개념 | 설명 |
|------|------|
| 클로저 정의 | 함수가 자신이 선언된 렉시컬 환경을 기억하는 것 |
| 핵심 특성 | 외부 함수 종료 후에도 외부 변수에 접근 가능 |
| 주요 활용 | 데이터 은닉, 상태 유지, 팩토리 함수, 모듈 패턴 |
| 반복문 주의 | `var` 사용 시 같은 변수를 참조하는 문제 → `let`으로 해결 |
| 메모리 관리 | 불필요한 참조는 정리하고, 필요한 데이터만 캡처 |

클로저는 JavaScript의 함수가 일급 객체이고, 렉시컬 스코프를 따르기 때문에 자연스럽게 발생하는 현상입니다.
별도의 문법이 아니라 언어의 동작 방식 자체이므로, 원리를 이해하면 일상적인 코드에서도 클로저가 어디서 사용되고 있는지 자연스럽게 보이게 됩니다.
