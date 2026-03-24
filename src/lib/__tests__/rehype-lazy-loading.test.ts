import { addLazyLoading } from "../rehype-lazy-loading";

describe("addLazyLoading", () => {
  it("img 요소에 loading='lazy'를 추가한다", () => {
    const input = '<img src="/images/test.png" alt="test" />';
    const output = addLazyLoading(input);
    expect(output).toContain('loading="lazy"');
    expect(output).toContain('src="/images/test.png"');
  });

  it("이미 loading 속성이 있는 img는 스킵한다", () => {
    const input = '<img loading="eager" src="/images/test.png" />';
    const output = addLazyLoading(input);
    expect(output).toContain('loading="eager"');
    expect(output).not.toContain('loading="lazy"');
  });

  it("img 외 요소는 영향받지 않는다", () => {
    const input = "<p>hello</p><span>world</span>";
    const output = addLazyLoading(input);
    expect(output).toBe(input);
  });

  it("중첩 구조 내 img도 처리한다 (figure > div > img)", () => {
    const input = `<figure>
  <div className="image-frame">
    <img className="theme-light" src="/images/posts/test-light.png" alt="test" />
    <img className="theme-dark" src="/images/posts/test-dark.png" alt="test" />
  </div>
</figure>`;
    const output = addLazyLoading(input);
    const matches = output.match(/loading="lazy"/g);
    expect(matches).toHaveLength(2);
  });

  it("여러 img 요소를 모두 처리한다", () => {
    const input = `<img src="/a.png" />
<img src="/b.png" />
<img src="/c.png" />`;
    const output = addLazyLoading(input);
    const matches = output.match(/loading="lazy"/g);
    expect(matches).toHaveLength(3);
  });

  it("self-closing이 아닌 img도 처리한다", () => {
    const input = '<img src="/test.png">';
    const output = addLazyLoading(input);
    expect(output).toContain('loading="lazy"');
  });

  it("혼합: loading 있는 img와 없는 img를 올바르게 구분한다", () => {
    const input = `<img loading="eager" src="/a.png" />
<img src="/b.png" />
<img loading="lazy" src="/c.png" />`;
    const output = addLazyLoading(input);
    expect(output).toContain('<img loading="eager"');
    expect(output).toContain('<img loading="lazy" src="/b.png"');
    expect(output).toContain('<img loading="lazy" src="/c.png"');
    const lazyMatches = output.match(/loading="lazy"/g);
    expect(lazyMatches).toHaveLength(2);
  });
});
