import type {
  DatePropertyValue,
  NumberPropertyValue,
  TitleInputPropertyValue,
  RichTextInputPropertyValue,
  SelectPropertyValue,
  Color,
  RichText,
  SelectOption,
  MultiSelectPropertyValue,
  MultiSelectOption,
} from '@notionhq/client/build/src/api-types';
import {common} from './common';

export namespace properties {
  export function text(text: string): Omit<RichTextInputPropertyValue, 'id'> {
    return {
      type: 'rich_text',
      rich_text: [common.richText(text)],
    };
  }

  export function richText(text: RichText[]): Omit<RichTextInputPropertyValue, 'id'> {
    return {
      type: 'rich_text',
      rich_text: text,
    };
  }

  export function title(text: string): Omit<TitleInputPropertyValue, 'id'> {
    return {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: text,
          },
        },
      ],
    };
  }

  export function number(number: number): Omit<NumberPropertyValue, 'id'> {
    return {
      type: 'number',
      number: number,
    };
  }

  export function date(time: string): Omit<DatePropertyValue, 'id'> {
    return {
      type: 'date',
      date: {
        start: time,
      },
    };
  }

  export function select(name: string, color: Color = 'default'): Omit<SelectPropertyValue, 'id'> {
    return {
      type: 'select',
      select: {
        name: name,
        color: color,
      } as SelectOption,
    };
  }

  export function multiSelect(names: string[]): Omit<MultiSelectPropertyValue, 'id'> {
    return {
      type: 'multi_select',
      multi_select: names.map(name => {
        return {
          name: name,
          color: 'default',
        } as MultiSelectOption;
      }),
    };
  }
}
