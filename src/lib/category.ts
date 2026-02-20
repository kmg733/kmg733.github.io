import type { PostMeta, CategoryTree, CategoryNode, SubcategoryNode } from "@/types";

/**
 * 포스트 목록에서 카테고리 트리를 생성한다.
 * - 실제 글이 있는 카테고리만 포함
 * - 카테고리/서브카테고리 모두 가나다순 정렬
 */
export function buildCategoryTree(
  posts: Pick<PostMeta, "category" | "subcategory">[]
): CategoryTree {
  if (posts.length === 0) return [];

  const categoryMap = new Map<
    string,
    { count: number; subcategories: Map<string, number> }
  >();

  for (const post of posts) {
    const entry = categoryMap.get(post.category) ?? {
      count: 0,
      subcategories: new Map<string, number>(),
    };

    entry.count += 1;

    if (post.subcategory) {
      const subCount = entry.subcategories.get(post.subcategory) ?? 0;
      entry.subcategories.set(post.subcategory, subCount + 1);
    }

    categoryMap.set(post.category, entry);
  }

  const tree: CategoryNode[] = [];

  for (const [name, entry] of categoryMap) {
    const subcategories: SubcategoryNode[] = [];

    for (const [subName, subCount] of entry.subcategories) {
      subcategories.push({ name: subName, count: subCount });
    }

    subcategories.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    tree.push({
      name,
      count: entry.count,
      subcategories,
    });
  }

  tree.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  return tree;
}
