import {common, RICH_TEXT_CONTENT_CHARACTERS_LIMIT} from '../src/common';

describe('richText', () => {
  const res = common.richText(Array(2000).fill('a').join(''), {
    annotations: {
      // @ts-expect-error test flag
      color: 'custom',
    },
    url: 'abc',
  })[0];

  it('should have have a proper format', () => {
    expect(res.type).toBe('text');
    expect(typeof res.annotations).toBe('object');
    expect(res.annotations?.color).toBe('custom');
    if ('text' in res) {
      expect(typeof res.text).toBe('object');
      expect(typeof res.text.content).toBe('string');
      expect(typeof res.text.link).toBe('object');
      expect(res.text.link?.url).toBe('abc');
    } else fail('res did not contain the "text" key');
  });

  it('should have truncated long text', () => {
    if ('text' in res) expect(res.text.content.length).toBe(RICH_TEXT_CONTENT_CHARACTERS_LIMIT);
    else fail('res did not contain the "text" key');
  });
});
