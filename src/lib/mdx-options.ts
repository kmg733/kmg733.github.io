/**
 * remark-gfm 각주가 만드는 영문 라벨("Footnotes", "Back to reference N")을 한국어로 바꿉니다.
 * 각주 제목은 sr-only라 화면에는 보이지 않고 스크린 리더가 읽습니다.
 */
export const remarkRehypeOptions = {
  footnoteLabel: "각주",
  footnoteBackLabel(referenceIndex: number, rereferenceIndex: number): string {
    const label = `본문 ${referenceIndex + 1}번 각주 위치로 돌아가기`;
    return rereferenceIndex > 1 ? `${label} (${rereferenceIndex}번째 참조)` : label;
  },
};
