import {CustomTypes, SelectColor} from './api-types';
import {common} from './common';

export type CustomValueMap = {
  Name: CustomTypes.Title;
  Status: CustomTypes.Select;
  Organization: CustomTypes.RichText;
  Repository: CustomTypes.RichText;
  Number: CustomTypes.Number;
  Assignees: CustomTypes.MultiSelect;
  Milestone: CustomTypes.RichText;
  Labels: CustomTypes.MultiSelect;
  Author: CustomTypes.RichText;
  Created: CustomTypes.Date;
  Updated: CustomTypes.Date;
  ID: CustomTypes.Number;
  Link: CustomTypes.URL;
};

export namespace properties {
  export function text(text: string): CustomTypes.RichText {
    return {
      type: 'rich_text',
      rich_text: common.richText(text),
    };
  }

  export function richText(text: CustomTypes.RichText['rich_text']): CustomTypes.RichText {
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

  export function select(name: string, color: SelectColor = 'default'): CustomTypes.Select {
    return {
      type: 'select',
      select: {
        name: name,
        color: color,
      },
    };
  }

  export function multiSelect(names: string[]): CustomTypes.MultiSelect {
    return {
      type: 'multi_select',
      multi_select: names.map(name => {
        return {
          name: name,
        };
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
