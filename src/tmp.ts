import {Client} from '@notionhq/client';

const notion = new Client({auth: 'secret_HE0s44l8fNfF8ZdjdkUogejuhTOv3FQzsuKfJqIyETb'});

(async () => {
  const blockId = '0f74cb87-0ffc-4975-b5b3-9308df2427ed';
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  });
  console.log(
    JSON.stringify(
      response.results.map((o: any) => o.paragraph),
      null,
      2
    )
  );

  await notion.blocks.update({
    block_id: response.results[0].id,
    type: 'paragraph',
    paragraph: {
      text: [
        {
          type: 'text',
          text: {
            content: 'abc',
          },
        },
      ],
    },
  });
})();
