import unified from 'unified';
import markdown from 'remark-parse';
import type {Block, RichTextInputPropertyValue} from '@notionhq/client/build/src/api-types';
import {parseRoot} from './internal';
import type {Root} from './types';
import gfm from 'remark-gfm';
import {properties} from '../properties';

function removeHTML(text: string): string {
  return text.replace(/<.*>.*<\/.*>/g, '');
}

export function parseBodyToBlocks(body: string): Block[] {
  const withoutHtml = removeHTML(body);
  const tokens = unified().use(markdown).use(gfm).parse(withoutHtml);
  return parseRoot(tokens as unknown as Root);
}

export function parseBodyToProperty(body: string): Omit<RichTextInputPropertyValue, 'id'> {
  const withoutHtml = removeHTML(body);
  return properties.richText(withoutHtml);
}
