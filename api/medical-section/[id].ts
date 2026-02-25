import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/*
  Разрешённые id разделов (строго из Notion ссылок)
*/
const ALLOWED_IDS = [
  "30f595e6e9d681c7a2f6ca6a618d260f",
  "30f595e6e9d681f29991ca2559df6c18",
  "30f595e6e9d681dd8987cb8c9f53a80f",
  "30f595e6e9d681789cc8eedd1aa92c7e",
  "30f595e6e9d6818e8d96fe90f8aa6c49",
  "30f595e6e9d6818bb2a7e2d5c110fc7f",
  "30f595e6e9d681ba8303eb0d3b879148",
];

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

    const rawId = Array.isArray(id) ? id[0] : id;

    // удаляем дефисы если вдруг пришли
    const cleanId = rawId.replace(/-/g, "");

    // проверяем что id разрешён
    if (!ALLOWED_IDS.includes(cleanId)) {
      return res.status(403).json({ error: "Invalid section id" });
    }

    const blocks = await notion.blocks.children.list({
      block_id: cleanId,
    });

    const content = parseMedicalSection(blocks);

    return res.status(200).json({
      id: cleanId,
      content,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


