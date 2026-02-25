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

app.get("/medical-card", async (req, res) => {
  try {
    const page = await notion.pages.retrieve({
      page_id: TEST_PAGE_ID,
    });

    const blocks = await notion.blocks.children.list({
      block_id: TEST_PAGE_ID,
    });

    res.json({ page, blocks });
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

