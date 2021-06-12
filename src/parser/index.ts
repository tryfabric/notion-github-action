import unified from 'unified';
import markdown from 'remark-parse';
import type {Block} from '@notionhq/client/build/src/api-types';
import {parseNode} from './internal';

export function parseBody(body: string): Block[] {
  const tokens = unified().use(markdown).parse(body);
  return parseNode(tokens as unknown as Node);
}
