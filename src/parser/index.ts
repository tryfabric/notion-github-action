import unified from 'unified';
import markdown from 'remark-parse';
import type {Block} from '@notionhq/client/build/src/api-types';
import {parseRoot} from './internal';
import {Root} from './types';
import gfm from 'remark-gfm';

export function parseBody(body: string): Block[] {
  const tokens = unified().use(markdown).use(gfm).parse(body);
  return parseRoot(tokens as unknown as Root);
}
