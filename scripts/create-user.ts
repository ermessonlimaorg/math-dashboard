import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@mathdash.com' },
    update: { passwordHash },
    create: {
      email: 'admin@mathdash.com',
      name: 'Administrador',
      passwordHash,
      role: 'admin'
    }
  })
  
  console.log('Usuário criado:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
