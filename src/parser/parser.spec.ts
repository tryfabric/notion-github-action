import {parseBody} from './index';
import {Annotations, RichText} from '@notionhq/client/build/src/api-types';
import {blocks} from '../blocks';

function richText(content: string, annotations: Partial<Annotations> = {}, url?: string): RichText {
  return {
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
      content: content,
      link: url
        ? {
            type: 'url',
            url: url,
          }
        : undefined,
    },
  } as RichText;
}

describe('gfm parser', () => {
  it('should parse paragraph with nested annotations', () => {
    const text = 'Hello _world **foo**_!';
    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([
        richText('Hello '),
        richText('world ', {italic: true}),
        richText('foo', {italic: true, bold: true}),
        richText('!'),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse text with hrefs and annotations', () => {
    const text = 'hello world [this is a _url_](https://example.com) end';
    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([
        richText('hello world '),
        richText('this is a ', {}, 'https://example.com'),
        richText('url', {italic: true}, 'https://example.com'),
        richText(' end'),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });
});
