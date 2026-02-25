require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client } = require("@notionhq/client");

const app = express();
app.use(cors());
app.use(express.json());

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

  const sections = {
    analyses: [],
    ultrasound: [],
    ecg: [],
    doctors: [],
  };

  const results = blocks?.results || [];

  results.forEach((block) => {
    if (block.type === "heading_2") {
      const title = block.heading_2?.rich_text?.[0]?.plain_text;

      if (title === "Результаты анализов") {
        sections.analyses.push(title);
      }

      if (title === "УЗИ") {
        sections.ultrasound.push(title);
      }

      if (title === "ЭКГ") {
        sections.ecg.push(title);
      }

      if (title === "Врачи") {
        sections.doctors.push(title);
      }
    }
  });

  return { patient, sections };
}

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
    // eslint-disable-next-line no-console
    console.error("Error fetching medical card from Notion:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

