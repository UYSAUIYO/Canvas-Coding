import { PrismaClient } from '../../../../prisma/generated/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // 解析 mysql://user:pass@host:port/database 格式
  const dbUrl = process.env.DATABASE_URL!
  const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/(.+)$/)
  if (!match) throw new Error('Invalid DATABASE_URL format')
  const [, user, password, host, port, database] = match
  const adapter = new PrismaMariaDb({
    host,
    port: Number(port) || 3306,
    user,
    password,
    database,
  })
  return new (PrismaClient as unknown as new (opts: Record<string, unknown>) => PrismaClient)({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
