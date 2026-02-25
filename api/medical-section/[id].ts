import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

function parseMedicalSection(blocks: any) {
  const content = (blocks.results || [])
    .map((block: any) => {
      if (block.type === "paragraph") {
        return {
          type: "paragraph",
          text:
            block.paragraph?.rich_text
              ?.map((r: any) => r.plain_text)
              .join("") || "",
        };
      }

      if (block.type === "bulleted_list_item") {
        return {
          type: "bulleted_list_item",
          text:
            block.bulleted_list_item?.rich_text
              ?.map((r: any) => r.plain_text)
              .join("") || "",
        };
      }

      if (block.type === "numbered_list_item") {
        return {
          type: "numbered_list_item",
          text:
            block.numbered_list_item?.rich_text
              ?.map((r: any) => r.plain_text)
              .join("") || "",
        };
      }

      if (block.type === "image") {
        return {
          type: "image",
          url:
            block.image?.file?.url ||
            block.image?.external?.url ||
            "",
        };
      }

      if (block.type === "file") {
        return {
          type: "file",
          url:
            block.file?.file?.url ||
            block.file?.external?.url ||
            "",
        };
      }

      return null;
    })
    .filter(Boolean);

  return content;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing section id" });
    }

    // ВАЖНО: используем id как есть
    const blockId = Array.isArray(id) ? id[0] : id;

    const blocks = await notion.blocks.children.list({
      block_id: blockId,
    });

    const content = parseMedicalSection(blocks);

    return res.status(200).json({
      id: blockId,
      content,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
}



