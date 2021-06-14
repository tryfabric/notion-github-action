import type {
  DatePropertyValue,
  NumberPropertyValue,
  TitleInputPropertyValue,
  RichTextInputPropertyValue,
  SelectPropertyValue,
  Color,
  RichText,
} from '@notionhq/client/build/src/api-types';

export namespace properties {
  export function text(text: string): Omit<RichTextInputPropertyValue, 'id'> {
    return {
      type: 'rich_text',
      rich_text: [
        {
          type: 'text',
          text: {
            content: text,
          },
        },
      ],
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

  export function select(id: string, name: string, color: Color): Omit<SelectPropertyValue, 'id'> {
    return {
      type: 'select',
      select: {
        id: id,
        name: name,
        color: color,
      },
    };
  }
}
