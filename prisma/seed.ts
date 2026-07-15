import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// 建立（或保留既有的）後台管理員帳號。
// 可用環境變數覆寫，未設定時沿用歷史相容帳號：
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME
// 登入頁帳號欄輸入 `admin` 會自動對應 admin@mifaso.com（見 lib/auth.ts）。
const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@mifaso.com";
  const name = process.env.SEED_ADMIN_NAME ?? "管理員";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123456";
  const password = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password, role: "ADMIN" },
  });

  console.log(`Admin user ready: ${admin.email} (role: ${admin.role})`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("使用預設密碼 admin123456，正式環境請設定 SEED_ADMIN_PASSWORD 或登入後更換。");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
