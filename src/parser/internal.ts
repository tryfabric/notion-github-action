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
import {md} from './types';
import {blocks} from '../blocks';
import {common} from '../common';

function parseInline(element: md.PhrasingContent, options?: common.RichTextOptions): RichText[] {
  const copy = {
    annotations: {
      ...(options?.annotations ?? {}),
    },
    url: options?.url,
  };

  switch (element.type) {
    case 'image':
      return [common.richText(element.title ?? element.url, copy)];

    case 'text':
      return [common.richText(element.value, copy)];

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
      copy.url = element.url;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'inlineCode':
      copy.annotations.code = true;
      return [common.richText(element.value, copy)];

    default:
      return [];
  }
}

function parseParagraph(element: md.Paragraph): ParagraphBlock {
  const text = element.children.flatMap(child => parseInline(child));
  return blocks.paragraph(text);
}

function parseHeading(element: md.Heading): HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock {
  const text = element.children.flatMap(child => parseInline(child));

  switch (element.depth) {
    case 1:
      return blocks.headingOne(text);

    case 2:
      return blocks.headingTwo(text);

    default:
      return blocks.headingThree(text);
  }
}

function parseCode(element: md.Code): ParagraphBlock {
  const text = [common.richText(element.value, {annotations: {code: true}})];
  return blocks.paragraph(text);
}

function parseList(
  element: md.List
): (BulletedListItemBlock | NumberedListItemBlock | ToDoBlock)[] {
  return element.children.flatMap(item => {
    const paragraph = item.children[0];
    if (paragraph.type !== 'paragraph') {
      return [] as (BulletedListItemBlock | NumberedListItemBlock | ToDoBlock)[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child));

    if (element.start) {
      return [blocks.numberedListItem(text)];
    } else if (item.checked === true || item.checked === false) {
      return [blocks.toDo(item.checked, text)];
    } else {
      return [blocks.bulletedListItem(text)];
    }
  });
}

function parseNode(node: md.FlowContent): Block[] {
  switch (node.type) {
    case 'heading':
      return [parseHeading(node)];

    case 'paragraph':
      return [parseParagraph(node)];

    case 'code':
      return [parseCode(node)];

    case 'blockquote':
      return node.children.flatMap(parseNode);

    case 'list':
      return parseList(node);

    default:
      return [];
  }
}

export function parseBlocks(root: md.Root): Block[] {
  return root.children.flatMap(parseNode);
}
