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
import {RichTextBuilder} from './rich_text_builder';
import {blocks} from '../blocks';

function isLeaf(value: Node | Leaf): value is Leaf {
  return value.type === 'code' || value.type === 'text' || value.type === 'inlineCode';
}

function parseText(node: Node | Leaf, builder: RichTextBuilder): RichText {
  switch (node.type) {
    case 'inlineCode':
      builder.annotations.code = true;
      break;

    case 'code':
      builder.annotations.code = true;
      break;

    case 'emphasis':
      builder.annotations.italic = true;
      break;

    case 'strong':
      builder.annotations.bold = true;
      break;

    case 'link':
      builder.href = node.url;
      break;
  }

  return isLeaf(node) ? builder.build(node.value) : parseText(node.children[0], builder);
}

function parseListItem(
  node: ListItemNode,
  type: 'bulleted_list_item' | 'numbered_list_item'
): BulletedListItemBlock | NumberedListItemBlock {
  if (node.children[0].type !== 'paragraph') {
    throw new Error('invariant failure');
  }

  const builder = new RichTextBuilder();

  return blocks.listItem(
    type,
    node.children.map(node => parseText(node, builder))
  );
}

function parseHeading(
  node: HeadingNode
): (HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock)[] {
  const key: 'heading_1' | 'heading_2' | 'heading_3' = `heading_${node.depth}`;
  const builder = new RichTextBuilder();

  return [
    blocks.heading(
      key,
      node.children.map(node => parseText(node, builder))
    ),
  ];
}

function parseParagraph(node: ParagraphNode): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  return [blocks.paragraph(node.children.map(node => parseText(node, builder)))];
}

function parseList(node: ListNode): (BulletedListItemBlock | NumberedListItemBlock)[] {
  const type = node.start ? 'numbered_list_item' : 'bulleted_list_item';
  return node.children.map(item => parseListItem(item, type));
}

function parseCode(node: CodeLeaf): ParagraphBlock[] {
  const builder = new RichTextBuilder();
  return [blocks.paragraph([parseText(node, builder)])];
}

export function parseNode(root: Node): Block[] {
  return root.children.flatMap((node: Node | Leaf): Block[] => {
    switch (node.type) {
      case 'heading':
        return parseHeading(node);

      case 'paragraph':
        return parseParagraph(node);

      case 'list':
        return parseList(node);

      case 'blockquote':
        return parseNode(node);

      case 'code':
        return parseCode(node);

      default:
        throw new Error(`Node type ${node.type} not handled.`);
    }
  });
}
