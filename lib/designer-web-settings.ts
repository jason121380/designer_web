import {
  DESIGNER_WEB_SETTINGS_KEY,
  defaultDesignerWebContent,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";

export async function getDesignerWebContent() {
  if (!process.env.DATABASE_URL) return defaultDesignerWebContent;

  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: DESIGNER_WEB_SETTINGS_KEY },
    });
    return parseDesignerWebContent(row?.value);
  } catch {
    return defaultDesignerWebContent;
  }
}
