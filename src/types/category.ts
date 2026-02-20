/**
 * 서브카테고리 노드
 */
export interface SubcategoryNode {
  name: string;
  count: number;
}

/**
 * 카테고리 노드 (대분류)
 */
export interface CategoryNode {
  name: string;
  count: number;
  subcategories: SubcategoryNode[];
}

/**
 * 카테고리 트리 (전체 구조)
 */
export type CategoryTree = CategoryNode[];
