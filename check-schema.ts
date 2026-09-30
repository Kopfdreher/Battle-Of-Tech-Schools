import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name IN ('id', 'user_id');
  `
  console.log(result)
}
main().finally(() => prisma.$disconnect())
