import {CustomTypes, RichTextItemRequest} from './api-types';

// https://developers.notion.com/reference/errors#limits-for-property-values
export const RICH_TEXT_CONTENT_CHARACTERS_LIMIT = 1000;

function truncateTextContent(text: string): string {
  return text.length > RICH_TEXT_CONTENT_CHARACTERS_LIMIT
    ? text.substring(0, RICH_TEXT_CONTENT_CHARACTERS_LIMIT - 1) + '…'
    : text;
}

export namespace common {
  export interface RichTextOptions {
    annotations?: RichTextItemRequest['annotations'];
    url?: string;
  }

  export function richText(
    content: string,
    options: RichTextOptions = {}
  ): CustomTypes.RichText['rich_text'] {
    const annotations = options.annotations ?? {};
    const truncated = truncateTextContent(content);

    return [
      {
        type: 'text',
        annotations: {
          bold: false,
          strikethrough: false,
          underline: false,
          italic: false,
          code: false,
          color: 'default',
          ...annotations,
        },
        text: {
          content: truncated,
          link: options.url ? {url: options.url} : undefined,
        },
      },
    ];
  }
}
