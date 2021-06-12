export interface ThematicBreakLeafNode {
  type: 'thematicBreak';
}

export interface HeadingLeafNode {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: Inline[];
}

export interface ParagraphLeafNode {
  type: 'paragraph';
  children: Inline[];
}

export interface CodeLeafNode {
  type: 'code';
  lang: string;
  value: string;
}

export interface InlineText {
  type: 'text';
  value: string;
}

export interface InlineEmphasis {
  type: 'emphasis';
  children: Inline[];
}

export interface InlineStrong {
  type: 'strong';
  children: Inline[];
}

export interface InlineCode {
  type: 'inlineCode';
  value: string;
}

export interface InlineLink {
  type: 'link';
  url: string;
  children: Inline[];
}

export interface InlineHtml {
  type: 'html';
  value: string;
  children: Inline[];
}

export interface NodeQuoteContainerNode {
  type: 'blockquote';
  children: LeafNode[];
}

export interface ListContainerNode {
  type: 'list';
  start: number | null;
  children: {
    type: 'listitem';
    children: LeafNode[];
  }[];
}

export interface RootNode {
  type: 'root';
  children: (ContainerNode | LeafNode)[];
}

export type Inline =
  | InlineText
  | InlineEmphasis
  | InlineStrong
  | InlineCode
  | InlineLink
  | InlineHtml;

export type LeafNode = ThematicBreakLeafNode | HeadingLeafNode | ParagraphLeafNode | CodeLeafNode;

export type ContainerNode = NodeQuoteContainerNode | ListContainerNode;
