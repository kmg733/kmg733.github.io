import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * 클라이언트에서 렌더링 중인지 반환하는 훅
 *
 * 서버 렌더링과 hydration 첫 렌더에서는 false, 그 뒤로는 true를 반환한다.
 * useEffect 안에서 setMounted(true)를 호출하는 mounted 패턴을 대신한다.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
