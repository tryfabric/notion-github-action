import type {
  BulletedListItemBlock,
  HeadingOneBlock,
  HeadingThreeBlock,
  HeadingTwoBlock,
  NumberedListItemBlock,
  ParagraphBlock,
  RichText,
  ToDoBlock,
} from '@notionhq/client/build/src/api-types';

// https://developers.notion.com/reference/errors#limits-for-property-values
export const RICH_TEXT_ARRAY_ELEMENTS_LIMIT = 100;

// A block object represents content within Notion. Blocks can be text, lists, media, and more. A page is a type of block, too!
export namespace blocks {
  export function paragraph(text: RichText[]): ParagraphBlock {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as ParagraphBlock;
  }

  export function headingOne(text: RichText[]): HeadingOneBlock {
    return {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as HeadingOneBlock;
  }

  export function headingTwo(text: RichText[]): HeadingTwoBlock {
    return {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as HeadingTwoBlock;
  }

  export function headingThree(text: RichText[]): HeadingThreeBlock {
    return {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as HeadingThreeBlock;
  }

  export function bulletedListItem(text: RichText[]): BulletedListItemBlock {
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as BulletedListItemBlock;
  }

  export function numberedListItem(text: RichText[]): NumberedListItemBlock {
    return {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
      },
    } as NumberedListItemBlock;
  }

  export function toDo(checked: boolean, text: RichText[]): ToDoBlock {
    return {
      object: 'block',
      type: 'to_do',
      to_do: {
        text: text.slice(0, RICH_TEXT_ARRAY_ELEMENTS_LIMIT),
        checked: checked,
      },
    } as ToDoBlock;
  }
}
