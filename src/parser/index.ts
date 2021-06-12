import unified from 'unified';
import markdown from 'remark-parse';
import type {Block} from '@notionhq/client/build/src/api-types';
import {parseRoot} from './internal';
import {RootNode} from './types';

export function parseBody(body: string): Block[] {
  const tokens = unified().use(markdown).parse(body);
  return parseRoot(tokens as unknown as RootNode);
}
