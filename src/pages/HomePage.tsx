import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/snippets', { method: 'POST' })
      const data = await res.json()
      navigate(`/${data.code}`)
    } catch {
      alert('Не удалось создать сниппет')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toLowerCase()
    if (code) navigate(`/${code}`)
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div>
          <h1 className="text-5xl font-bold text-white mb-2">Шара</h1>
          <p className="text-lg text-gray-400">Поделись кодом в реальном времени</p>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Создаю...' : 'Создать'}
        </button>

        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex-1 border-t border-gray-700" />
          <span>или</span>
          <div className="flex-1 border-t border-gray-700" />
        </div>

        <form onSubmit={handleJoin} className="flex gap-2 justify-center">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Введи код"
            maxLength={8}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg tracking-widest w-40 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Открыть
          </button>
        </form>
      </div>
    </div>
  )
}
