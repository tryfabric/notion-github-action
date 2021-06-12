import unified from 'unified';
import markdown from 'remark-parse';
import type {Block} from '@notionhq/client/build/src/api-types';
import {parseNode} from './internal';
import type {Node} from './types';

export function parseBody(body: string): Block[] {
  const tokens = unified().use(markdown).parse(body);
  return parseNode(tokens as unknown as Node);
}
