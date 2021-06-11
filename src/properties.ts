import type {
  DatePropertyValue,
  NumberPropertyValue,
  TitleInputPropertyValue,
} from '@notionhq/client/build/src/api-types';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace properties {
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
}
