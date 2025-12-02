import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data to keep the seed idempotent
  await prisma.feedback.deleteMany()
  await prisma.attempt.deleteMany()
  await prisma.solutionStep.deleteMany()
  await prisma.question.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  // Seed admin user
  const password = 'admin123'
  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
      passwordHash,
    }
  })

  console.log('Seeded user -> email: admin@example.com | password: admin123')

  // Seed questions
  const q1 = await prisma.question.create({
    data: {
      externalId: 'ext-q-1',
      title: 'Solve the linear equation',
      content: 'Solve for x: 2x + 3 = 11',
      topic: 'Algebra',
      difficulty: 'EASY',
      steps: {
        create: [
          { externalId: 'ext-s-1', order: 1, content: 'Subtract 3 from both sides: 2x = 8' },
          { externalId: 'ext-s-2', order: 2, content: 'Divide both sides by 2: x = 4' }
        ]
      }
    }
  })

  const q2 = await prisma.question.create({
    data: {
      externalId: 'ext-q-2',
      title: 'Area of a circle',
      content: 'Find the area of a circle with radius r = 3',
      topic: 'Geometry',
      difficulty: 'MEDIUM',
      steps: {
        create: [
          { externalId: 'ext-s-3', order: 1, content: 'Use A = πr^2' },
          { externalId: 'ext-s-4', order: 2, content: 'A = π * 9' }
        ]
      }
    }
  })

  const q3 = await prisma.question.create({
    data: {
      externalId: 'ext-q-3',
      title: 'Derivative of x^2',
      content: 'Compute d/dx (x^2)',
      topic: 'Calculus',
      difficulty: 'EASY',
      steps: {
        create: [
          { externalId: 'ext-s-5', order: 1, content: 'Use power rule: d/dx (x^n) = n*x^(n-1)' },
          { externalId: 'ext-s-6', order: 2, content: 'd/dx (x^2) = 2x' }
        ]
      }
    }
  })

  // Seed attempts
  const attempts = [
    { questionId: q1.id, correct: true, timeMs: 12000, attempts: 1, source: 'seed', topic: 'Algebra', difficulty: 'EASY' },
    { questionId: q1.id, correct: false, timeMs: 18000, attempts: 2, source: 'seed', topic: 'Algebra', difficulty: 'EASY' },
    { questionId: q2.id, correct: true, timeMs: 25000, attempts: 1, source: 'seed', topic: 'Geometry', difficulty: 'MEDIUM' },
    { questionId: q2.id, correct: false, timeMs: 30000, attempts: 2, source: 'seed', topic: 'Geometry', difficulty: 'MEDIUM' },
    { questionId: q3.id, correct: true, timeMs: 8000, attempts: 1, source: 'seed', topic: 'Calculus', difficulty: 'EASY' },
    { questionId: q3.id, correct: true, timeMs: 9000, attempts: 1, source: 'seed', topic: 'Calculus', difficulty: 'EASY' }
  ]
  for (const a of attempts) {
    await prisma.attempt.create({ data: a as any })
  }

  // Seed feedbacks
  await prisma.feedback.createMany({
    data: [
      { questionId: q1.id, rating: 5, comment: 'Clear steps!' },
      { questionId: q2.id, rating: 4, comment: 'Good explanation, maybe add drawings.' },
      { questionId: q3.id, rating: 5, comment: 'Very straightforward.' }
    ]
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
