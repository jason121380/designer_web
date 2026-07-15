import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  normalizeDesignerWebContent,
} from "@/lib/designer-web-content";
import { getDesignerWebContent } from "@/lib/designer-web-settings";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDesignerWebContent());
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });
  }

  const content = normalizeDesignerWebContent(await req.json());
  await prisma.siteSettings.upsert({
    where: { key: DESIGNER_WEB_SETTINGS_KEY },
    create: {
      key: DESIGNER_WEB_SETTINGS_KEY,
      value: JSON.stringify(content),
    },
    update: {
      value: JSON.stringify(content),
    },
  });

  return NextResponse.json(content);
}
