import {parseBody} from './index';
import {blocks} from '../blocks';
import {common} from '../common';

describe('gfm parser', () => {
  it('should parse paragraph with nested annotations', () => {
    const text = 'Hello _world **foo**_! `code`';
    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([
        common.richText('Hello '),
        common.richText('world ', {
          annotations: {italic: true},
        }),
        common.richText('foo', {
          annotations: {italic: true, bold: true},
        }),
        common.richText('! '),
        common.richText('code', {
          annotations: {code: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse text with hrefs and annotations', () => {
    const text = 'hello world [this is a _url_](https://example.com) end';
    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([
        common.richText('hello world '),
        common.richText('this is a ', {
          url: 'https://example.com',
        }),
        common.richText('url', {
          annotations: {italic: true},
          url: 'https://example.com',
        }),
        common.richText(' end'),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse thematic breaks', () => {
    const text = 'hello\n***\nworld';
    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([common.richText('hello')]),
      blocks.paragraph([common.richText('world')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse headings', () => {
    const text = `
# heading1
## heading2
### heading3
#### heading4
    `;

    const actual = parseBody(text);

    const expected = [
      blocks.headingOne([common.richText('heading1')]),
      blocks.headingTwo([common.richText('heading2')]),
      blocks.headingThree([common.richText('heading3')]),
      blocks.headingThree([common.richText('heading4')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block', () => {
    const text = `
hello
\`\`\`java
public class Foo {}
\`\`\`
    `;

    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([common.richText('hello')]),
      blocks.paragraph([
        common.richText('public class Foo {}', {
          annotations: {code: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse block quote', () => {
    const text = `
> # hello _world_
    `;

    const actual = parseBody(text);

    const expected = [
      blocks.headingOne([
        common.richText('hello '),
        common.richText('world', {
          annotations: {italic: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse list', () => {
    const text = `
hello
* a
* _b_
* **c**
    `;

    const actual = parseBody(text);

    const expected = [
      blocks.paragraph([common.richText('hello')]),
      blocks.bulletedListItem([common.richText('a')]),
      blocks.bulletedListItem([common.richText('b', {annotations: {italic: true}})]),
      blocks.bulletedListItem([common.richText('c', {annotations: {bold: true}})]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse html', () => {
    const text = '<sub>hello</sub>';
    const actual = parseBody(text);

    const expected = [blocks.paragraph([])];

    expect(actual).toStrictEqual(expected);
  });
});
