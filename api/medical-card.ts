import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const TEST_PAGE_ID = "30f595e6e9d6802b9a86c920c5207210";

function normalizeTitle(title: string) {
  return title
    .replace(/[^\w\sА-Яа-яЁё]/g, "")
    .trim()
    .toLowerCase();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const page = await notion.pages.retrieve({
      page_id: TEST_PAGE_ID,
    });

    const blocks = await notion.blocks.children.list({
      block_id: TEST_PAGE_ID,
    });

    const properties: any = (page as any)?.properties || {};

    const patient = {
      name: properties.Name?.title?.[0]?.plain_text || "",
      phone:
        properties.Phone?.rich_text?.[0]?.plain_text ||
        properties.Phone?.phone_number ||
        "",
      birthDate: properties["Дата рождения"]?.date?.start || "",
      admissionDate: properties["Дата приёма"]?.date?.start || "",
      checkup: properties["Чекап"]?.select?.name || "",
      status: properties.Status?.select?.name || "",
    };

    const sections: any[] = [];

    (blocks?.results || []).forEach((block: any) => {
      if (block.type === "child_page") {
        const title = block.child_page?.title || "";
        const titleNorm = normalizeTitle(title);

        let type = "generic";

        if (titleNorm.includes("результаты анализов")) type = "analyses";
        else if (titleNorm.includes("узи")) type = "ultrasound";
        else if (titleNorm.includes("экг")) type = "ecg";
        else if (titleNorm.includes("главный врач")) type = "doctor-main";
        else if (titleNorm.includes("уролог")) type = "doctor-urologist";
        else if (titleNorm.includes("спортивный врач")) type = "doctor-sport";
        else if (titleNorm.includes("реабилитолог")) type = "doctor-rehab";
        else if (titleNorm.includes("психотерапевт")) type = "doctor-psychotherapist";

        sections.push({
          id: block.id,
          title,
          type,
        });
      }
    });

    res.status(200).json({ patient, sections });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

