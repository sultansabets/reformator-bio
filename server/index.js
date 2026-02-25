require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client } = require("@notionhq/client");

const app = express();
app.use(cors());
app.use(express.json());

console.log("SERVER STARTING...");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const TEST_PAGE_ID = "30f595e6e9d6802b9a86c920c5207210";

function parseMedicalCard(page, blocks) {
  const properties = page?.properties || {};

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

  const sections = [];

  (blocks?.results || []).forEach((block) => {
    if (block.type === "child_page") {
      const title = block.child_page?.title || "";
      const titleNorm = title.toLowerCase();

      let type = "generic";

      if (titleNorm.includes("результаты анализов")) {
        type = "analyses";
      } else if (titleNorm.includes("узи")) {
        type = "ultrasound";
      } else if (titleNorm.includes("экг")) {
        type = "ecg";
      } else if (titleNorm.includes("главный врач")) {
        type = "doctor-main";
      } else if (titleNorm.includes("уролог")) {
        type = "doctor-urologist";
      } else if (titleNorm.includes("спортивный врач")) {
        type = "doctor-sport";
      } else if (titleNorm.includes("реабилитолог")) {
        type = "doctor-rehab";
      } else if (titleNorm.includes("психотерапевт")) {
        type = "doctor-psychotherapist";
      }

      sections.push({
        id: block.id,
        title,
        type,
      });
    }
  });

  return { patient, sections };
}

// 🔹 Получить медкарту
app.get("/medical-card", async (req, res) => {
  try {
    const page = await notion.pages.retrieve({
      page_id: TEST_PAGE_ID,
    });

    const blocks = await notion.blocks.children.list({
      block_id: TEST_PAGE_ID,
    });

    const parsed = parseMedicalCard(page, blocks);

    res.json(parsed);
  } catch (error) {
    console.error("Error fetching medical card:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Получить конкретный раздел
app.get("/medical-section/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const blocks = await notion.blocks.children.list({
      block_id: id,
    });

    const content = [];

    (blocks?.results || []).forEach((block) => {
      if (block.type === "paragraph") {
        content.push({
          type: "paragraph",
          text:
            block.paragraph?.rich_text
              ?.map((r) => r.plain_text)
              .join("") || "",
        });
      }

      if (block.type === "bulleted_list_item") {
        content.push({
          type: "bulleted_list_item",
          text:
            block.bulleted_list_item?.rich_text
              ?.map((r) => r.plain_text)
              .join("") || "",
        });
      }

      if (block.type === "image") {
        content.push({
          type: "image",
          url:
            block.image?.file?.url ||
            block.image?.external?.url ||
            "",
        });
      }
    });

    res.json({ content });
  } catch (error) {
    console.error("Error fetching section:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});