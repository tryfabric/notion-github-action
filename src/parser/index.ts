import unified from 'unified';
import markdown from 'remark-parse';
import type {Block, RichTextInputPropertyValue} from '@notionhq/client/build/src/api-types';
import {parseRoot} from './internal';
import type {Root} from './types';
import gfm from 'remark-gfm';
import {properties} from '../properties';
import github from 'remark-github';

function removeHTML(text: string): string {
  return text.replace(/<.*>.*<\/.*>/g, '');
}

interface ParseOptions {
  repositoryUrl?: string;
}

/**
 * Parses GitHub-flavored markdown text into Notion Blocks.
 * - Supports all heading types (heading depths 4, 5, 6 are treated as 3 for Notion)
 * - Supports numbered lists, bulleted lists, to-do lists
 * - Supports italics, bold, strikethrough, inline code, hyperlinks
 *
 * Per Notion limitations, these markdown attributes are not supported:
 * - Tables (removed)
 * - HTML tags and content (removed)
 * - Thematic breaks (removed)
 * - Code blocks (treated as paragraph)
 * - Block quotes (treated as paragraph)
 *
 * Additionally, formats GitHub-specific smart issue / user / commit links into URLs
 *
 * @param body any GFM text
 * @param options any additional options to use for parsing
 */
export async function parseBodyToBlocks(body: string, options?: ParseOptions): Promise<Block[]> {
  const withoutHtml = removeHTML(body);

  let root = unified().use(markdown).use(gfm).parse(withoutHtml);

  if (options?.repositoryUrl) {
    root = await unified().use(github, {repository: options.repositoryUrl}).run(root);
  }

  return parseRoot(root as unknown as Root);
}

export function parseBodyToProperty(body: string): Omit<RichTextInputPropertyValue, 'id'> {
  const withoutHtml = removeHTML(body);
  return properties.richText(withoutHtml);
}
