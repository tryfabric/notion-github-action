import {InputPropertyValueMap} from '@notionhq/client/build/src/api-endpoints';
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
  URLPropertyValue,
} from '@notionhq/client/build/src/api-types';
import {common} from './common';

namespace CustomTypes {
  type NoID<T> = Omit<T, 'id'>;

  export type RichText = NoID<RichTextInputPropertyValue>;
  export type Title = NoID<TitleInputPropertyValue>;
  export type Number = NoID<NumberPropertyValue>;
  export type Date = NoID<DatePropertyValue>;
  export type Select = NoID<SelectPropertyValue>;
  export type MultiSelect = NoID<MultiSelectPropertyValue>;
  export type URL = NoID<URLPropertyValue>;
}

export interface CustomValueMap extends InputPropertyValueMap {
  Name: CustomTypes.Title;
  Status: CustomTypes.Select;
  Organization: CustomTypes.RichText;
  Repository: CustomTypes.RichText;
  Number: CustomTypes.Number;
  Body: CustomTypes.RichText;
  Assignees: CustomTypes.MultiSelect;
  Milestone: CustomTypes.RichText;
  Labels: CustomTypes.MultiSelect;
  Author: CustomTypes.RichText;
  Created: CustomTypes.Date;
  Updated: CustomTypes.Date;
  ID: CustomTypes.Number;
  Link: CustomTypes.URL;
}

export namespace properties {
  export function text(text: string): CustomTypes.RichText {
    return {
      type: 'rich_text',
      rich_text: [common.richText(text)],
    };
  }

  export function richText(text: RichText[]): CustomTypes.RichText {
    return {
      type: 'rich_text',
      rich_text: text,
    };
  }

  export function title(text: string): CustomTypes.Title {
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

  export function number(number: number): CustomTypes.Number {
    return {
      type: 'number',
      number: number,
    };
  }

  export function date(time: string): CustomTypes.Date {
    return {
      type: 'date',
      date: {
        start: time,
      },
    };
  }

  export function getStatusSelectOption(state: 'open' | 'closed'): CustomTypes.Select {
    switch (state) {
      case 'open':
        return select('Open', 'green');
      case 'closed':
        return select('Closed', 'red');
    }
  }

  export function select(name: string, color: Color = 'default'): CustomTypes.Select {
    return {
      type: 'select',
      select: {
        name: name,
        color: color,
      } as SelectOption,
    };
  }

  export function multiSelect(names: string[]): CustomTypes.MultiSelect {
    return {
      type: 'multi_select',
      multi_select: names.map(name => {
        return {
          name: name,
        } as MultiSelectOption;
      }),
    };
  }

  export function url(url: string): CustomTypes.URL {
    return {
      type: 'url',
      url,
    };
  }
}
