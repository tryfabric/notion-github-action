import type {Annotations, RichText} from '@notionhq/client/build/src/api-types';

export class RichTextBuilder {
  public annotations: Annotations;
  public href: string | undefined;

  public constructor() {
    this.annotations = {
      bold: false,
      strikethrough: false,
      underline: false,
      italic: false,
      code: false,
      color: 'default',
    };

    this.href = undefined;
  }

  public build(text: string): RichText {
    return {
      type: 'text',
      annotations: this.annotations,
      href: this.href,
      text: {
        content: text,
      },
    } as RichText;
  }
}
