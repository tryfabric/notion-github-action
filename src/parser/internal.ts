import type {
  BulletedListItemBlock,
  HeadingOneBlock,
  HeadingThreeBlock,
  HeadingTwoBlock,
  NumberedListItemBlock,
  ParagraphBlock,
  RichText,
  Block,
} from '@notionhq/client/build/src/api-types';
import type {
  CodeLeafNode,
  ContainerNode,
  HeadingLeafNode,
  Inline,
  LeafNode,
  ListContainerNode,
  ParagraphLeafNode,
  RootNode,
} from './types';
import {RichTextBuilder} from './rich_text_builder';
import {blocks} from '../blocks';

function parseInline(element: Inline, builder: RichTextBuilder): RichText[] {
  const copy = builder.copy();
  switch (element.type) {
    case 'text':
      return [copy.build(element.value)];

    case 'emphasis':
      copy.annotations.italic = true;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'strong':
      copy.annotations.bold = true;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'link':
      copy.href = element.url;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'inlineCode':
      copy.annotations.code = true;
      return [copy.build(element.value)];

    case 'html':
      return [];
  }
}

function parseParagraph(element: ParagraphLeafNode): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  const text = element.children.flatMap(child => parseInline(child, builder));
  return [blocks.paragraph(text)];
}

function parseHeading(
  element: HeadingLeafNode
): (HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock)[] {
  const builder = new RichTextBuilder();
  const text = element.children.flatMap(child => parseInline(child, builder));

  switch (element.depth) {
    case 1:
      return [blocks.headingOne(text)];

    case 2:
      return [blocks.headingTwo(text)];

    default:
      return [blocks.headingThree(text)];
  }
}

function parseCode(element: CodeLeafNode): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  builder.annotations.code = true;
  const text = [builder.build(element.value)];

  return [blocks.paragraph(text)];
}

function parseList(element: ListContainerNode): (BulletedListItemBlock | NumberedListItemBlock)[] {
  return element.children.flatMap(item => {
    const builder = new RichTextBuilder();

    const paragraph = item.children[0];
    if (paragraph.type !== 'paragraph') {
      return [] as (BulletedListItemBlock | NumberedListItemBlock)[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child, builder));

    return element.start ? [blocks.numberedListItem(text)] : [blocks.bulletedListItem(text)];
  });
}

function parseNode(node: LeafNode | ContainerNode): Block[] {
  switch (node.type) {
    case 'thematicBreak':
      return [];

    case 'heading':
      return parseHeading(node);

    case 'paragraph':
      return parseParagraph(node);

    case 'code':
      return parseCode(node);

    case 'blockquote':
      return node.children.flatMap(parseNode);

    case 'list':
      return parseList(node);
  }
}

export function parseRoot(root: RootNode): Block[] {
  return root.children.flatMap(parseNode);
}
