import type {
  BulletedListItemBlock,
  HeadingOneBlock,
  HeadingThreeBlock,
  HeadingTwoBlock,
  NumberedListItemBlock,
  ParagraphBlock,
  RichText,
  Block,
  ToDoBlock,
} from '@notionhq/client/build/src/api-types';
import type {Code, FlowContent, Heading, List, Paragraph, PhrasingContent, Root} from './types';
import {RichTextBuilder} from './rich_text_builder';
import {blocks} from '../blocks';

function parseInline(element: PhrasingContent, builder: RichTextBuilder): RichText[] {
  const copy = builder.copy();
  switch (element.type) {
    case 'image':
      copy.href = element.url;
      return [copy.build(element.title ?? element.url)];

    case 'text':
      return [copy.build(element.value)];

    case 'delete':
      copy.annotations.strikethrough = true;
      return element.children.flatMap(child => parseInline(child, copy));

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

    default:
      return [];
  }
}

function parseParagraph(element: Paragraph): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  const text = element.children.flatMap(child => parseInline(child, builder));
  return [blocks.paragraph(text)];
}

function parseHeading(element: Heading): (HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock)[] {
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

function parseCode(element: Code): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  builder.annotations.code = true;
  const text = [builder.build(element.value)];

  return [blocks.paragraph(text)];
}

function parseList(element: List): (BulletedListItemBlock | NumberedListItemBlock | ToDoBlock)[] {
  return element.children.flatMap(item => {
    const builder = new RichTextBuilder();

    const paragraph = item.children[0];
    if (paragraph.type !== 'paragraph') {
      return [] as (BulletedListItemBlock | NumberedListItemBlock | ToDoBlock)[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child, builder));

    if (element.start) {
      return [blocks.numberedListItem(text)];
    } else if (item.checked === true || item.checked === false) {
      return [blocks.toDo(item.checked, text)];
    } else {
      return [blocks.bulletedListItem(text)];
    }
  });
}

function parseNode(node: FlowContent): Block[] {
  switch (node.type) {
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

    default:
      return [];
  }
}

export function parseRoot(root: Root): Block[] {
  return root.children.flatMap(parseNode);
}
