import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const apps = await prisma.application.findMany()
  console.log("Total apps:", apps.length)
  console.log("Apps with userId:", apps.filter(a => a.userId).map(a => ({ id: a.id, userId: a.userId, name: a.displayName })))
}
main().finally(() => prisma.$disconnect())
