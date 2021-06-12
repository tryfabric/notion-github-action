interface BaseNode<T extends string> {
  type: T;
  children: (Node | Leaf)[];
}

export interface HeadingNode extends BaseNode<'heading'> {
  depth: 1 | 2 | 3;
}

export type ParagraphNode = BaseNode<'paragraph'>;

type EmphasisNode = BaseNode<'emphasis'>;

interface LinkNode extends BaseNode<'link'> {
  title: string | null;
  url: string;
}

type StrongNode = BaseNode<'strong'>;

export interface ListNode extends BaseNode<'list'> {
  start: number | null;
  children: ListItemNode[];
}

export type ListItemNode = BaseNode<'listitem'>;

type BlockQuoteNode = BaseNode<'blockquote'>;

export type Node =
  | HeadingNode
  | ParagraphNode
  | EmphasisNode
  | StrongNode
  | ListNode
  | ListItemNode
  | BlockQuoteNode
  | LinkNode;

interface BaseLeaf<T extends string> {
  type: T;
  value: string;
}

type TextLeaf = BaseLeaf<'text'>;

export interface CodeLeaf extends BaseLeaf<'code'> {
  lang: string;
}

type InlineCodeLeaf = BaseLeaf<'inlineCode'>;

export type Leaf = TextLeaf | CodeLeaf | InlineCodeLeaf;
