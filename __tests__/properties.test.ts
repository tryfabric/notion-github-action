import {RichTextItemRequest} from '../src/api-types';
import {RICH_TEXT_CONTENT_CHARACTERS_LIMIT} from '../src/common';
import {properties} from '../src/properties';

describe('text', () => {
  it('should convert a string to RichText', () => {
    const res = properties.text('abc');

    expect(typeof res).toBe('object');
    expect(res.type).toBe('rich_text');
    expect(res.rich_text).toBeInstanceOf(Array);
    expect(res.rich_text.length).toBe(1);
    expect(res.rich_text[0].type).toBe('text');
  });

  it('should truncate long strings', () => {
    const veryLongString = Array(2000).fill('a').join('');
    const res = properties.text(veryLongString);

    expect(typeof res).toBe('object');
    expect(res.type).toBe('rich_text');
    expect(res.rich_text).toBeInstanceOf(Array);
    expect(res.rich_text.length).toBe(1);
    if ('text' in res.rich_text[0])
      expect(res.rich_text[0].text.content.length).toBe(RICH_TEXT_CONTENT_CHARACTERS_LIMIT);
    else fail('res.rich_text[0] did not contain the "text" key');
  });
});

describe('richText', () => {
  it('should correctly handle rich text', () => {
    const annotations = {
      bold: false,
      strikethrough: false,
      underline: false,
      italic: false,
      code: false,
      color: 'default',
    } as const;
    const input: RichTextItemRequest[] = [
      {
        type: 'text',
        text: {
          content: 'abc',
        },
        annotations,
      },
      {
        type: 'equation',
        annotations,
        equation: {
          expression: 'abc',
        },
      },
    ];

    const res = properties.richText(input);
    expect(typeof res).toBe('object');
    expect(res.type).toBe('rich_text');
    expect(res.rich_text).toBeInstanceOf(Array);
    expect(res.rich_text.length).toBe(2);
    expect(res.rich_text[0].type).toBe('text');
    expect(res.rich_text[1].type).toBe('equation');
  });
});

describe('title', () => {
  it('should convert a string to a Notion title', () => {
    const res = properties.title('abc');

    expect(typeof res).toBe('object');
    expect(res.type).toBe('title');
    expect(res.title).toBeInstanceOf(Array);
    expect(res.title.length).toBe(1);
    expect(res.title[0].type).toBe('text');
    if ('text' in res.title[0]) expect(res.title[0].text.content).toBe('abc');
    else fail('res.rich_text[0] did not contain the "text" key');
  });
});

describe('number', () => {
  it('should convert a number to a Notion number', () => {
    const res = properties.number(123);

    expect(typeof res).toBe('object');
    expect(res.type).toBe('number');
    expect(typeof res.number).toBe('number');
  });
});

describe('date', () => {
  it('should convert a string to a Notion date', () => {
    const res = properties.date('abc');

    expect(typeof res).toBe('object');
    expect(res.type).toBe('date');
    expect(typeof res.date).toBe('object');
    expect(res.date?.start).toBe('abc');
  });
});

describe('getStatusSelectOption', () => {
  for (const status of ['open', 'closed'] as const) {
    it(`should return a select for ${status}`, () => {
      const res = properties.getStatusSelectOption(status);

      expect(typeof res).toBe('object');
      expect(res.type).toBe('select');
      expect(typeof res.select).toBe('object');
      expect(typeof res.select?.name).toBe('string');
      expect(typeof res.select?.color).toBe('string');
    });
  }
});

describe('select', () => {
  it('should correctly create the desidered Select element', () => {
    const res = properties.select('abc', 'default');

    expect(typeof res).toBe('object');
    expect(res.type).toBe('select');
    expect(typeof res.select).toBe('object');
    expect(res.select?.name).toBe('abc');
    expect(res.select?.color).toBe('default');
  });
});

describe('multiSelect', () => {
  it('should correctly create the desidered multi_select element', () => {
    const arr = ['first', 'second', 'third'];
    const res = properties.multiSelect(arr);

    expect(typeof res).toBe('object');
    expect(res.type).toBe('multi_select');
    expect(res.multi_select).toBeInstanceOf(Array);
    arr.forEach(element => {
      expect(res.multi_select).toContainEqual({name: element});
    });
  });
});

describe('url', () => {
  it('should correctly create the desidered url element', () => {
    const res = properties.url('abc');

    expect(typeof res).toBe('object');
    expect(res.type).toBe('url');
    expect(res.url).toBe('abc');
  });
});
