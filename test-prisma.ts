import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.count()
  console.log('Users count:', users)
}
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
