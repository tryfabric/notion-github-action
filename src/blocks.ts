import type {
  BulletedListItemBlock,
  HeadingOneBlock,
  HeadingThreeBlock,
  HeadingTwoBlock,
  NumberedListItemBlock,
  ParagraphBlock,
  RichText,
} from '@notionhq/client/build/src/api-types';

type Heading<T extends 'heading_1' | 'heading_2' | 'heading_3'> = Extract<
  HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock,
  {type: T}
>;

type ListItem<T extends 'bulleted_list_item' | 'numbered_list_item'> = Extract<
  BulletedListItemBlock | NumberedListItemBlock,
  {type: T}
>;

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

  export function heading<T extends 'heading_1' | 'heading_2' | 'heading_3'>(
    type: T,
    text: RichText[]
  ): Heading<T> {
    return {
      object: 'block',
      type: type,
      [type]: {
        text: text,
      },
    } as unknown as Heading<T>;
  }

  export function listItem<T extends 'bulleted_list_item' | 'numbered_list_item'>(
    type: T,
    text: RichText[]
  ): ListItem<T> {
    return {
      object: 'block',
      type: type,
      [type]: text,
    } as unknown as ListItem<T>;
  }
}
