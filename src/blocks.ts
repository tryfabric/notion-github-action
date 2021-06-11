import type {ParagraphBlock, RichText} from '@notionhq/client/build/src/api-types';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace blocks {
  export function paragraph(text: string): ParagraphBlock {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        text: [
          {
            type: 'text',
            text: {
              content: text,
            },
          } as RichText,
        ],
      },
    } as ParagraphBlock;
  }
}
