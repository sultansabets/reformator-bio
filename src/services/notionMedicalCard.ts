import { Client } from "@notionhq/client";

const pageId = import.meta.env.VITE_NOTION_PAGE_ID ?? "30f595e6e9d6802b9a86c920c5207210";
const token = import.meta.env.VITE_NOTION_TOKEN;

const notion = token
  ? new Client({ auth: token })
  : null;

export interface ParsedMedicalCard {
  name: string;
  phone: string;
  admissionDate: string;
  birthDate: string;
  checkup: string;
  status: string;
  sections: unknown[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropText(prop: any): string {
  if (!prop) return "";
  if (prop.title?.[0]?.plain_text != null) return prop.title[0].plain_text;
  if (prop.rich_text?.[0]?.plain_text != null) return prop.rich_text[0].plain_text;
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropPhone(prop: any): string {
  return prop?.phone_number ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropDate(prop: any): string {
  return prop?.date?.start ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropSelect(prop: any): string {
  return prop?.select?.name ?? "";
}

export async function getMedicalCard(): Promise<{ page: unknown; blocks: unknown[] }> {
  if (!notion) {
    return { page: {}, blocks: [] };
  }
  try {
    const [page, blocksRes] = await Promise.all([
      notion.pages.retrieve({ page_id: pageId }),
      notion.blocks.children.list({ block_id: pageId }),
    ]);
    return {
      page,
      blocks: blocksRes.results ?? [],
    };
  } catch {
    return { page: {}, blocks: [] };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMedicalCard(page: any, blocks: unknown[]): ParsedMedicalCard {
  const properties = page?.properties ?? {};
  return {
    name: getPropText(properties["Name"] ?? properties["Имя"]) || "",
    phone: getPropPhone(properties["Phone"] ?? properties["Телефон"]) || "",
    admissionDate: getPropDate(properties["Дата приёма"] ?? properties["Admission date"]) || "",
    birthDate: getPropDate(properties["Дата рождения"] ?? properties["Birth date"]) || "",
    checkup: getPropSelect(properties["Чекап"] ?? properties["Checkup"]) || "",
    status: getPropSelect(properties["Status"] ?? properties["Статус"]) || "",
    sections: Array.isArray(blocks) ? blocks : [],
  };
}
