import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Vibe Coding Builder</h1>
        <p className="mt-4 text-lg text-gray-500">可视化 Prompt 生成管道</p>
        <p className="mt-2 text-sm text-gray-400">
          拖拽 → 编排 → 生成高质量 AI Prompt
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              进入工作台
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
