import type {Annotations, RichText} from '@notionhq/client/build/src/api-types';
import {common} from '../common';

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
    return common.richText(text, {
      annotations: this.annotations,
      url: this.href,
    });
  }

  /**
   * Returns a deep copy of `this`
   */
  public copy(): RichTextBuilder {
    const copy = new RichTextBuilder();
    copy.annotations = {...this.annotations};
    copy.href = this.href;

    return copy;
  }
}
