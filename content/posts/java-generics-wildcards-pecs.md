---
title: "Java 경계 와일드카드와 PECS — extends와 super는 언제 쓰나"
date: "2026-07-16"
description: "removeIf 구현을 열어보다 만난 Predicate<? super E>에서 출발해, Java 제네릭의 상한 경계(? extends T)와 하한 경계(? super T) 와일드카드를 정리합니다. 제네릭의 불공변성에서 경계 와일드카드가 왜 필요한지, 컴파일러가 읽기·쓰기를 어떤 근거로 허용/차단하는지, 그리고 PECS(Producer-Extends, Consumer-Super) 원칙을 Collections.copy·Stream·removeIf 사례로 다룹니다."
category: "개발"
subcategory: "Java"
tags: ["guide", "intermediate", "Java"]
thumbnail: "/images/thumbnails/java"
glossary:
  - id: "generics"
    term: "제네릭(Generics)"
    brief: "타입을 파라미터로 받아 컴파일 시점에 타입 안전성을 확보하는 기능"
    detail: "List<String>처럼 클래스나 메서드가 다룰 타입을 외부에서 지정받게 하는 기능이다. 캐스팅 없이 원소를 꺼낼 수 있고, 잘못된 타입을 넣으면 런타임이 아닌 컴파일 시점에 걸러진다. Java 5부터 도입되었다."
  - id: "type-parameter"
    term: "타입 파라미터(Type Parameter)"
    brief: "제네릭 선언에서 실제 타입 자리에 들어가는 이름표(T, E, K, V 등)"
    detail: "class Box<T>의 T처럼, 실제 타입이 정해지기 전까지 자리를 대신하는 형식 매개변수다. 사용 시점에 Box<String>처럼 구체 타입으로 치환된다. 관례상 T(Type), E(Element), K/V(Key/Value)를 쓴다."
  - id: "invariance"
    term: "불공변성(Invariance)"
    brief: "Integer가 Number의 하위 타입이어도 List<Integer>는 List<Number>의 하위 타입이 아닌 성질"
    detail: "Java 제네릭은 기본적으로 불공변이다. 즉 A가 B의 하위 타입이라도 List<A>와 List<B> 사이에는 아무런 상속 관계가 없다. 이 제약이 타입 안전성을 지키지만 유연성을 떨어뜨리며, 이를 완화하기 위해 와일드카드가 등장했다."
  - id: "wildcard"
    term: "와일드카드(Wildcard)"
    brief: "구체 타입 대신 '알 수 없는 어떤 타입'을 나타내는 물음표 기호(?)"
    detail: "List<?>처럼 타입 인자 자리에 ?를 쓰면 '무언가의 List이지만 그 무언가가 무엇인지는 특정하지 않는다'는 의미가 된다. 여기에 extends/super로 상한·하한 경계를 걸어 허용 범위를 좁힐 수 있다."
  - id: "upper-bounded"
    term: "상한 경계 와일드카드(? extends T)"
    brief: "T와 T의 하위 타입만 허용하는 와일드카드. 읽기(꺼내기)에 안전"
    detail: "? extends Number는 Number, Integer, Double 등 Number 이하의 어떤 타입인지 특정할 수 없는 컬렉션을 뜻한다. 꺼낼 때는 최소한 Number임이 보장되므로 읽기가 가능하지만, 정확한 타입을 몰라 넣기는 막힌다. 값을 생산(Producer)하는 자리에 쓴다."
  - id: "lower-bounded"
    term: "하한 경계 와일드카드(? super T)"
    brief: "T와 T의 상위 타입만 허용하는 와일드카드. 쓰기(넣기)에 안전"
    detail: "? super Integer는 Integer, Number, Object 중 어떤 타입인지 특정할 수 없는 컬렉션을 뜻한다. Integer는 이들 모두의 하위 타입이므로 넣기가 안전하지만, 꺼낼 때는 타입을 특정할 수 없어 Object로만 받는다. 값을 소비(Consumer)하는 자리에 쓴다."
  - id: "pecs"
    term: "PECS"
    brief: "Producer-Extends, Consumer-Super. 경계 와일드카드 선택 기준"
    detail: "Effective Java에서 제시된 원칙으로, 파라미터가 값을 생산(꺼내 읽음)하면 ? extends T, 소비(넣음)하면 ? super T를 쓰라는 규칙이다. 둘 다 하는 파라미터에는 와일드카드를 쓰지 않고 T를 그대로 쓴다."
  - id: "producer"
    term: "생산자(Producer)"
    brief: "컬렉션에서 값을 꺼내 바깥으로 공급하는 역할"
    detail: "데이터를 읽어서 내보내는 쪽이다. Collections.copy에서 원본(src)이나 forEach가 순회하는 스트림이 여기 해당한다. 생산자는 읽기만 하면 되므로 ? extends T로 열어 유연성을 얻는다."
  - id: "consumer"
    term: "소비자(Consumer)"
    brief: "바깥에서 받은 값을 컬렉션에 넣어 소비하는 역할"
    detail: "데이터를 받아서 담는 쪽이다. Collections.copy에서 목적지(dest)나 Consumer<? super T> 콜백이 여기 해당한다. 소비자는 쓰기만 하면 되므로 ? super T로 열어 유연성을 얻는다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/java-light.png" alt="Java 경계 와일드카드와 PECS" />
      <img className="theme-dark" src="/images/thumbnails/java-dark.png" alt="Java 경계 와일드카드와 PECS" />
    </div>
  </div>
</figure>

## 이 글을 쓰게 된 계기 — `removeIf`를 열어보다

평소 `List`에서 조건에 맞는 원소를 안전하게 지울 때 `removeIf`를 즐겨 썼습니다.
`for` 루프를 돌며 `remove`를 호출하면 `ConcurrentModificationException`이 나기 십상인데, `removeIf`는 그런 걱정 없이 한 줄로 끝나기 때문입니다.

```java
List<Integer> numbers = new ArrayList<>(List.of(1, 2, 3, 4));
numbers.removeIf(n -> n % 2 == 0);   // 짝수 제거 → [1, 3]
```

그러다 문득 "이건 내부적으로 어떻게 구현했지?" 싶어 `Collection.removeIf`의 기본 구현을 열어봤습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img src="/images/posts/java-generics-wildcards-pecs/removeif-source.png" alt="Java Collection.removeIf 기본 구현" />
    </div>
    <figcaption>Java <code>Collection.removeIf</code>의 기본 구현. 시그니처의 <code>Predicate&lt;? super E&gt;</code>에 눈이 갔습니다.</figcaption>
  </div>
</figure>

`filter`가 null인지 확인한 뒤, `iterator()`로 순회하며 조건에 맞는 원소를 `Iterator.remove()`로 지우는 코드입니다.
눈길이 간 건 구현부가 아니라 시그니처였습니다.

```java
default boolean removeIf(Predicate<? super E> filter)
```

늘 람다만 넘겼을 뿐, 정작 이 `<? super E>`가 왜 붙어 있는지 생각해본 적이 없더군요.
그게 궁금해서 찾아본 내용을 정리한 글입니다. `Predicate<? super E>`가 왜 저렇게 생겼는지는 [마지막 실전 사례](#실전-사례)에서 다시 이야기합니다.

---

## 무엇이 헷갈리는가

`List<? extends Number>`와 `List<? super Integer>`. 처음엔 둘 다 그냥 "Number 언저리의 리스트"로 보여서 뭐가 다른지 감이 안 옵니다.
심지어 한쪽은 `add`가 안 되고, 다른 쪽은 `get`을 하면 `Object`만 나옵니다. 규칙만 외우면 며칠 지나 또 헷갈립니다.

그래서 규칙을 외우는 대신, 컴파일러가 왜 이렇게 동작하는지를 따라가 보려 합니다.
제네릭의 <Term id="invariance">불공변성</Term> 때문에 경계 와일드카드가 왜 필요해졌는지 보고, `extends`와 `super`가 읽기·쓰기를 어떻게 나누는지, 마지막으로 이걸 한 줄로 줄인 **PECS**까지 순서대로 다룹니다.

---

## 시작점: 제네릭은 왜 불편함을 남겼나

<Term id="generics">제네릭</Term>은 Java 5에서 "캐스팅 지옥"과 런타임 `ClassCastException`을 없애려고 도입됐습니다.

```java
// 제네릭 이전 — 컴파일러는 타입을 모른다
List list = new ArrayList();
list.add("hello");
Integer n = (Integer) list.get(0);  // 컴파일 OK, 런타임 ClassCastException 💥

// 제네릭 이후 — 컴파일 시점에 걸린다
List<String> list = new ArrayList<>();
list.add("hello");
Integer n = list.get(0);  // ❌ 컴파일 에러 (실행 전에 발견)
```

타입을 <Term id="type-parameter">타입 파라미터</Term>로 고정한 덕분에 안전해졌습니다.
그런데 이 고정이 다른 불편을 불러옵니다.

```java
void printAll(List<Number> numbers) {
    for (Number n : numbers) System.out.println(n);
}

List<Integer> ints = List.of(1, 2, 3);
printAll(ints);  // ❌ 컴파일 에러
```

`Integer`는 `Number`의 하위 타입이 맞는데도, `List<Integer>`를 `List<Number>` 자리에 넘길 수 없습니다.
이 어긋남을 메우려고 나온 게 경계 와일드카드입니다.

---

## 불공변성 — `List<Integer>`는 `List<Number>`가 아니다

개별 값과 컬렉션은 상속 관계가 다르게 흘러갑니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/java-generics-wildcards-pecs/invariance-light.png" alt="제네릭 불공변성" />
      <img className="theme-dark" src="/images/posts/java-generics-wildcards-pecs/invariance-dark.png" alt="제네릭 불공변성" />
    </div>
  </div>
  <figcaption>Integer는 Number의 하위 타입이지만, List&lt;Integer&gt;는 List&lt;Number&gt;의 하위 타입이 아닙니다.</figcaption>
</figure>

이 성질을 <Term id="invariance">불공변성</Term>이라고 부릅니다. 왜 굳이 막을까요? 반대로 허용된다고 치고 코드를 따라가 보면 이유가 보입니다.

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;   // (가정) 이게 허용된다면 — nums와 ints는 '같은 리스트'다
nums.add(3.14);             // Number 자리니까 Double을 넣을 수 있다
Integer i = ints.get(0);    // 💥 같은 리스트라 그 Double이 그대로 나온다 — 타입 안전성 붕괴
```

`nums`는 새 리스트가 아니라 `ints`와 같은 객체를 가리키는 다른 이름입니다(대입은 참조만 복사하니까요). 그래서 `nums`로 넣은 값이 `ints`에도 그대로 보입니다.
`List<Integer>`를 `List<Number>`로 받는 순간 `Double`을 `Integer` 리스트에 몰래 넣는 길이 열리는 셈입니다.
컴파일러는 이런 일이 벌어지지 못하게 두 타입의 상속 관계를 끊어 둡니다.

<div className="info-box">
  <strong>정리하면</strong><br/><br/>
  값 하나는 <code>Integer</code>를 <code>Number</code>로 대입할 수 있습니다(공변).<br/>
  하지만 <code>List&lt;Integer&gt;</code>는 <code>List&lt;Number&gt;</code>와 남남입니다(불공변).<br/>
  안전을 위한 제약이지만, 앞의 <code>printAll</code>처럼 멀쩡한 코드까지 막아 버립니다.
</div>

---

## 와일드카드 `?` — "어떤 타입인지 특정하지 않는다"

그렇다고 매번 타입을 딱 맞춰 쓰기엔 불편합니다. "정확한 타입은 몰라도 된다"고 말할 방법이 필요한데, 그게 <Term id="wildcard">와일드카드</Term> `?`입니다.

```java
void printAll(List<?> list) {          // '무언가의 List'
    for (Object o : list) System.out.println(o);
}

printAll(List.of(1, 2, 3));            // ✅ List<Integer> OK
printAll(List.of("a", "b"));           // ✅ List<String> OK
```

`List<?>`는 어떤 타입의 리스트든 받습니다. 대신 타입을 특정할 수 없으니, 값을 넣는 건 안 됩니다.

```java
void addOne(List<?> list) {
    list.add(1);   // ❌ 컴파일 에러 — 이게 무슨 타입의 리스트인지 모른다
}
```

여기에 경계(bound)를 붙이면, "아무 타입"이 아니라 "이 범위 안의 타입"으로 좁힐 수 있습니다. 이게 상한/하한 경계 와일드카드입니다.

---

## 상한 경계 `? extends T` — 읽기 전용(Producer)

앞으로의 예시는 아래 타입 계층을 기준으로 합니다. `extends`는 여기서 아래쪽(하위 타입)으로, 뒤이어 볼 `super`는 위쪽(상위 타입)으로 범위를 엽니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/java-generics-wildcards-pecs/type-hierarchy-light.png" alt="Java 타입 계층 구조" />
      <img className="theme-dark" src="/images/posts/java-generics-wildcards-pecs/type-hierarchy-dark.png" alt="Java 타입 계층 구조" />
    </div>
  </div>
  <figcaption>화살표는 상속(extends) 방향입니다. Integer·Double·Long은 Number의 하위 타입, Number는 Object의 하위 타입입니다.</figcaption>
</figure>

`? extends Number`는 `Number`이거나 그 하위 타입을 뜻합니다.

```java
List<? extends Number> list = new ArrayList<Integer>();  // ✅
list = new ArrayList<Double>();                          // ✅ 재대입도 OK

Number n = list.get(0);   // ✅ 꺼내기 — 최소한 Number임은 보장된다
list.add(1);              // ❌ 넣기 — 컴파일 에러
```

- **읽기가 되는 이유**: `list`가 `List<Integer>`든 `List<Double>`이든 꺼낸 원소는 `Number`의 하위 타입입니다. 그래서 `Number`로 받는 건 항상 안전합니다.
- **쓰기가 막히는 이유**: 컴파일러는 이게 `List<Integer>`인지 `List<Double>`인지 모릅니다. `Integer`를 넣었는데 실제로는 `List<Double>`이었다면 타입이 깨지죠. 확신할 수 없으니 넣기를 막습니다.

그래서 <Term id="upper-bounded">상한 경계 와일드카드</Term>는 값을 꺼내 주기만 하는 자리, 곧 <Term id="producer">생산자(Producer)</Term>에 어울립니다.

---

## 하한 경계 `? super T` — 쓰기 전용(Consumer)

`? super Integer`는 `Integer`이거나 그 상위 타입을 뜻합니다.

```java
List<? super Integer> list = new ArrayList<Number>();   // ✅ 실제 객체는 Number 리스트
list = new ArrayList<Object>();                         // ✅ 재대입도 OK

list.add(1);              // ✅ 넣기 — Integer는 어떤 경우든 하위 타입이다
Integer i = list.get(0);  // ❌ 꺼내기 — 실제로 Number를 담아도 막힌다
Object o = list.get(0);   // ✅ Object로만 받을 수 있다
```

- **쓰기가 되는 이유**: `list`가 `List<Integer>`든 `List<Number>`든 `List<Object>`든, `Integer`는 이들 모두의 하위 타입입니다. 그래서 `Integer`를 넣는 건 어느 쪽이든 안전합니다.
- **읽기가 막히는 이유**: 컴파일러는 실제 객체가 `ArrayList<Number>`라는 걸 일부러 잊고 선언 타입 `? super Integer`만 봅니다. 원소가 `Integer`인지 `Number`인지 `Object`인지 알 수 없으니, 이들의 공통 상한인 `Object`로만 꺼내 줍니다.

<div className="info-box">
  <strong>"Number로 초기화했는데 왜 Object로만 나오죠?"</strong><br/><br/>
  읽기가 막히는 건 대입한 객체가 아니라 <strong>변수의 선언 타입</strong>(<code>? super Integer</code>) 때문입니다.<br/>
  위에서 <code>list = new ArrayList&lt;Object&gt;()</code>로 다시 대입할 수 있었듯, 이 변수는 언제든 다른 상위 타입 리스트를 가리킬 수 있습니다. 그래서 컴파일러는 초기값 <code>Number</code>를 믿지 않고 늘 <code>Object</code>로만 꺼내게 합니다.<br/>
  재대입 줄을 지워도 결과는 같습니다 — 원인은 <code>? super</code> 선언 그 자체입니다.
</div>

그래서 <Term id="lower-bounded">하한 경계 와일드카드</Term>는 값을 받아 담기만 하는 자리, 곧 <Term id="consumer">소비자(Consumer)</Term>에 어울립니다.

### 두 경계의 허용 범위 비교

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/java-generics-wildcards-pecs/wildcard-range-light.png" alt="extends와 super의 허용 범위 비교" />
      <img className="theme-dark" src="/images/posts/java-generics-wildcards-pecs/wildcard-range-dark.png" alt="extends와 super의 허용 범위 비교" />
    </div>
  </div>
  <figcaption>extends는 기준 타입에서 아래로(하위 타입), super는 위로(상위 타입) 범위를 엽니다.</figcaption>
</figure>

| 구분 | `? extends Number` | `? super Integer` |
|------|-------------------|-------------------|
| **허용 타입** | Number, Integer, Double, Long … | Integer, Number, Object |
| **방향** | 기준에서 아래(하위 타입) | 기준에서 위(상위 타입) |
| **읽기(get)** | ✅ `Number`로 꺼냄 | ⚠️ `Object`로만 꺼냄 |
| **쓰기(add)** | ❌ 불가 | ✅ `Integer` 넣기 |
| **역할** | Producer(생산) | Consumer(소비) |

<div className="warning-box">
  <strong>범위가 겹쳐 보여도 서로 바꿔 쓸 수 없습니다</strong><br/><br/>
  <code>? extends Number</code>와 <code>? super Integer</code>는 허용 타입 목록이 일부 겹칩니다(둘 다 Number, Integer 포함).<br/>
  하지만 <strong>허용하는 연산이 정반대</strong>입니다. 하나는 읽기 전용, 하나는 쓰기 전용이죠.<br/>
  겹치는 건 '타입 집합'일 뿐, '할 수 있는 일'은 대칭입니다.
</div>

---

## PECS — 하나의 문장으로 정리하기

지금까지의 내용은 *Effective Java*의 한 문구로 요약됩니다.

> **PECS: Producer-Extends, Consumer-Super**
> 생산하면(꺼내면) extends, 소비하면(넣으면) super.

파라미터를 볼 때 이 컬렉션이 값을 주는 쪽인지 받는 쪽인지만 따지면 됩니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/java-generics-wildcards-pecs/pecs-decision-light.png" alt="PECS 판단 플로우차트" />
      <img className="theme-dark" src="/images/posts/java-generics-wildcards-pecs/pecs-decision-dark.png" alt="PECS 판단 플로우차트" />
    </div>
  </div>
  <figcaption>꺼내기만 하면 extends, 넣기만 하면 super, 둘 다면 와일드카드 없이 T.</figcaption>
</figure>

읽기와 쓰기를 다 해야 할 땐 와일드카드를 쓰지 않습니다. `extends`는 쓰기를 막고 `super`는 읽기를 제한하니, 둘 다 필요하면 어느 경계도 걸 수 없거든요. 이럴 땐 그냥 `T`를 씁니다.

---

## 실전 사례

### 1. `Collections.copy` — 한 시그니처에 둘 다

`copy`는 원본을 읽어 목적지에 씁니다. 읽는 쪽은 생산자, 쓰는 쪽은 소비자입니다.

```java
public static <T> void copy(
    List<? super T> dest,     // 목적지: T를 넣는다 → Consumer → super
    List<? extends T> src)    // 원본:   T를 꺼낸다 → Producer → extends
```

이 시그니처 덕분에 아래가 모두 컴파일됩니다.

```java
List<Object> dest = new ArrayList<>(List.of(0, 0, 0));
List<Integer> src = List.of(1, 2, 3);

Collections.copy(dest, src);   // ✅ T=Integer, dest는 상위 타입(Object)이라도 OK
```

만약 두 파라미터를 그냥 `List<T>`로 뒀다면, `dest`가 `List<Object>`이고 `src`가 `List<Integer>`인 이 자연스러운 호출이 막혔을 겁니다.

### 2. Stream API — 콜백의 유연성

`Stream`의 시그니처 곳곳에 PECS가 박혀 있습니다.

```java
// forEach: 원소를 콜백에 넘겨 '소비'시킨다 → Consumer는 super
void forEach(Consumer<? super T> action)

// map: 입력을 받아(소비) 결과를 만든다(생산) → 입력 super, 출력 extends
<R> Stream<R> map(Function<? super T, ? extends R> mapper)
```

`super`가 어떤 유연성을 주는지 보겠습니다.

```java
Stream<Integer> stream = Stream.of(1, 2, 3);

Consumer<Number> printNumber = n -> System.out.println(n);
stream.forEach(printNumber);   // ✅ Number를 받는 콜백에 Integer 스트림을 넘길 수 있다
```

`Number`를 처리할 수 있는 콜백이면 `Integer`도 당연히 처리합니다.
`forEach`가 `Consumer<? super T>`로 열려 있으니, 이렇게 더 일반적인 콜백을 그대로 재사용할 수 있습니다.
`Consumer<T>`였다면 `Consumer<Integer>`만 받았겠죠.

<div className="info-box">
  <strong>한 번 더 뒤집어 보기</strong><br/><br/>
  <code>Consumer&lt;? super T&gt;</code>가 되는 이유: 콜백은 스트림에서 나온 원소를 <strong>받아서 소비</strong>합니다.<br/>
  소비하는 쪽이니 <code>super</code>. PECS의 C(Consumer-Super)가 그대로 적용된 자리입니다.
</div>

### 3. `removeIf` — 다시 출발점으로

이제 이 글을 시작하게 만든 그 시그니처를 봅니다.

```java
default boolean removeIf(Predicate<? super E> filter)
```

`Predicate<T>`는 값 하나를 받아 `boolean`을 돌려주는 함수형 인터페이스입니다. 메서드가 `test(T)` 하나뿐이죠.
그래서 글 첫머리의 `removeIf(n -> n % 2 == 0)`처럼 람다를 그대로 넘길 수 있고, 그 람다가 `test`의 구현이 됩니다.

이 `test`는 원소를 받아서 참/거짓을 판정합니다. 원소가 `Predicate` 쪽으로 들어가는 거죠.
원소를 소비하는 자리니 <Term id="consumer">Consumer</Term>이고, 그래서 `? super E`입니다. 앞서 본 `Consumer<? super T>`와 똑같은 이야기입니다.

`super E`로 열어 둔 덕분에 **더 일반적인 `Predicate`를 재사용**할 수 있습니다.

```java
List<String> names = new ArrayList<>(Arrays.asList("a", null, "b", null));

Predicate<Object> isNull = Objects::isNull;   // Object를 판별하는 범용 Predicate
names.removeIf(isNull);                        // ✅ String 컬렉션에 그대로 재사용 → [a, b]
```

`Object`를 판별할 수 있는 `Predicate`라면 `String` 하나 판별하는 건 문제도 아니고요.
늘 아무 생각 없이 넘기던 람다였는데, 시그니처 하나에 이런 배려가 들어 있었습니다.

---

## 와일드카드가 없었다면

와일드카드의 값어치는 빼보면 확실해집니다. 앞 사례에서 와일드카드를 걷어내면, 그 불편이 고스란히 호출하는 쪽으로 넘어갑니다.

### `? extends Number`를 빼면 — 읽는 쪽

리스트에서 값을 꺼내 더하기만 하는 메서드가 있다고 해보죠.

```java
// 와일드카드 X — List<Number>로 못 박음
double sumAll(List<Number> list) {
    double sum = 0;
    for (Number n : list) sum += n.doubleValue();
    return sum;
}
```

읽기만 하는데도 `List<Number>`로 고정한 탓에, 흔하디흔한 `List<Integer>`조차 넘길 수 없습니다.

```java
List<Integer> ints = List.of(1, 2, 3);
sumAll(ints);   // ❌ 컴파일 에러 (List<Integer> ≠ List<Number>)

// 호출하려면 매번 List<Number>로 옮겨 담아야 한다
List<Number> copy = new ArrayList<>(ints);
sumAll(copy);   // ✅ 대신 불필요한 복사 비용을 치른다
```

파라미터를 `List<? extends Number>`로 열어 두면 이 복사가 필요 없어집니다.

### `? super E`를 빼면 — 쓰는 쪽

`removeIf`가 `Predicate<E>`였다고 해봅시다.

```java
// 와일드카드 X — 컬렉션 타입과 정확히 일치하는 Predicate만 받음
default boolean removeIf(Predicate<E> filter)
```

이러면 범용 콜백을 재사용할 수 없습니다.

```java
List<String> names = new ArrayList<>(Arrays.asList("a", null, "b"));
Predicate<Object> isNull = Objects::isNull;

names.removeIf(isNull);   // ❌ Predicate<String>만 받으므로 거부

// 컬렉션 타입마다 똑같은 로직을 새로 만들어야 한다
Predicate<String> isNullStr = Objects::isNull;
names.removeIf(isNullStr);   // ✅ 대신 String 전용으로 중복 생성
```

파라미터를 `Predicate<? super E>`로 열어 두면 `Predicate<Object>` 하나를 모든 컬렉션에 재사용할 수 있습니다.

와일드카드를 빼면, 불공변성이 막아 둔 자연스러운 호출을 되살리는 비용을 결국 호출부가 치릅니다. 불필요한 복사거나, 타입마다 새로 찍어내는 중복 코드죠.

---

## 정리

| 구분 | `? extends T` | `? super T` | 와일드카드 없음 `T` |
|------|--------------|-------------|-------------------|
| **의미** | T와 하위 타입 | T와 상위 타입 | T 고정 |
| **읽기(get)** | ✅ T로 꺼냄 | ⚠️ Object로만 | ✅ |
| **쓰기(add)** | ❌ | ✅ T 넣기 | ✅ |
| **역할** | Producer(생산) | Consumer(소비) | 생산·소비 둘 다 |
| **판단** | 값을 꺼내 쓰나? | 값을 넣나? | 둘 다 하나? |

경계 와일드카드는 그냥 외우는 문법이 아니라, 불공변성이 걸어 둔 빗장을 안전하게 푸는 도구입니다.
`extends`는 하위 타입이 뭔지는 몰라도 꺼내 읽는 건 안전하다고 보고, `super`는 상위 타입이 뭔지는 몰라도(꺼낼 땐 `Object`뿐이지만) 넣는 건 안전하다고 봅니다.

둘 중 뭘 쓸지는 결국 한 문장이면 됩니다. Producer면 Extends, Consumer면 Super.
