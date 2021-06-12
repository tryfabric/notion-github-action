import type {
  BulletedListItemBlock,
  HeadingOneBlock,
  HeadingThreeBlock,
  HeadingTwoBlock,
  NumberedListItemBlock,
  ParagraphBlock,
  RichText,
} from '@notionhq/client/build/src/api-types';

// A block object represents content within Notion. Blocks can be text, lists, media, and more. A page is a type of block, too!
export namespace blocks {
  export function paragraph(text: RichText[]): ParagraphBlock {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        text: text,
      },
    } as ParagraphBlock;
  }

  export function headingOne(text: RichText[]): HeadingOneBlock {
    return {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        text: text,
      },
    } as HeadingOneBlock;
  }

  export function headingTwo(text: RichText[]): HeadingTwoBlock {
    return {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        text: text,
      },
    } as HeadingTwoBlock;
  }

  export function headingThree(text: RichText[]): HeadingThreeBlock {
    return {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        text: text,
      },
    } as HeadingThreeBlock;
  }

  export function bulletedListItem(text: RichText[]): BulletedListItemBlock {
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        text: text,
      },
    } as BulletedListItemBlock;
  }

  export function numberedListItem(text: RichText[]): NumberedListItemBlock {
    return {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        text: text,
      },
    } as NumberedListItemBlock;
  }
}
