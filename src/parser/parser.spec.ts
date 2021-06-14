import {markdownToBlocks, markdownToProperty} from './index';
import {blocks} from '../blocks';
import {common} from '../common';
import {properties} from '../properties';

describe('gfm parser', () => {
  it('should parse paragraph with nested annotations', async () => {
    const text = 'Hello _world **foo**_! `code`';
    const actual = await markdownToBlocks(text);

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

  it('should parse text with hrefs and annotations', async () => {
    const text = 'hello world [this is a _url_](https://example.com) end';
    const actual = await markdownToBlocks(text);

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

  it('should parse thematic breaks', async () => {
    const text = 'hello\n***\nworld';
    const actual = await markdownToBlocks(text);

    const expected = [
      blocks.paragraph([common.richText('hello')]),
      blocks.paragraph([common.richText('world')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse headings', async () => {
    const text = `
# heading1
## heading2
### heading3
#### heading4
    `;

    const actual = await markdownToBlocks(text);

    const expected = [
      blocks.headingOne([common.richText('heading1')]),
      blocks.headingTwo([common.richText('heading2')]),
      blocks.headingThree([common.richText('heading3')]),
      blocks.headingThree([common.richText('heading4')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block', async () => {
    const text = `
hello
\`\`\`java
public class Foo {}
\`\`\`
    `;

    const actual = await markdownToBlocks(text);

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

  it('should parse block quote', async () => {
    const text = `
> # hello _world_
    `;

    const actual = await markdownToBlocks(text);

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

  it('should parse list', async () => {
    const text = `
hello
* a
* _b_
* **c**
    `;

    const actual = await markdownToBlocks(text);

    const expected = [
      blocks.paragraph([common.richText('hello')]),
      blocks.bulletedListItem([common.richText('a')]),
      blocks.bulletedListItem([common.richText('b', {annotations: {italic: true}})]),
      blocks.bulletedListItem([common.richText('c', {annotations: {bold: true}})]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse github extensions', async () => {
    const text = `
https://example.com

~~strikethrough content~~

| a | b  |  c |  d  |
| - | :- | -: | :-: |

* [ ] to do
* [x] done
    `;

    const actual = await markdownToBlocks(text);

    const expected = [
      blocks.paragraph([
        common.richText('https://example.com', {
          url: 'https://example.com',
        }),
      ]),
      blocks.paragraph([
        common.richText('strikethrough content', {
          annotations: {strikethrough: true},
        }),
      ]),
      blocks.toDo(false, [common.richText('to do')]),
      blocks.toDo(true, [common.richText('done')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should remove html', async () => {
    const text = `
<sub>a</sub>
b
    `;

    const actual = await markdownToBlocks(text);

    const expected = [blocks.paragraph([common.richText('b')])];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse github links', async () => {
    const text = `
Commit: f8083175fe890cbf14f41d0a06e7aa35d4989587

Issue or PR: #1

Mention: @username
    `;

    const url = 'https://github.com/remarkjs/remark-github.git';

    const actual = await markdownToBlocks(text, {
      repositoryUrl: url,
    });

    const expected = [
      blocks.paragraph([
        common.richText('Commit: '),
        common.richText('f808317', {
          annotations: {code: true},
          url: 'https://github.com/remarkjs/remark-github/commit/f8083175fe890cbf14f41d0a06e7aa35d4989587',
        }),
      ]),
      blocks.paragraph([
        common.richText('Issue or PR: '),
        common.richText('#1', {
          url: 'https://github.com/remarkjs/remark-github/issues/1',
        }),
      ]),
      blocks.paragraph([
        common.richText('Mention: '),
        common.richText('@username', {
          annotations: {bold: true},
          url: 'https://github.com/username',
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should convert markdown to property', () => {
    const text = '_Hello_, world!';
    const actual = markdownToProperty(text);

    const expected = properties.richText([
      common.richText('Hello', {
        annotations: {
          italic: true,
        },
      }),
      common.richText(', world!'),
    ]);

    expect(actual).toStrictEqual(expected);
  });
});
