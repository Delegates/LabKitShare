import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'
import type { Extension } from '@codemirror/state'

const LANGUAGES: Record<string, { label: string; ext: () => Extension }> = {
  javascript: { label: 'JavaScript', ext: () => javascript({ jsx: true, typescript: true }) },
  python: { label: 'Python', ext: python },
  html: { label: 'HTML', ext: html },
  css: { label: 'CSS', ext: css },
  json: { label: 'JSON', ext: json },
  markdown: { label: 'Markdown', ext: markdown },
  sql: { label: 'SQL', ext: sql },
  xml: { label: 'XML', ext: xml },
  java: { label: 'Java', ext: java },
  cpp: { label: 'C/C++', ext: cpp },
  plaintext: { label: 'Text', ext: () => [] as unknown as Extension },
}

export default function EditorPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)
  const isRemoteUpdate = useRef(false)
  const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  function buildConnection() {
    return new HubConnectionBuilder()
      .withUrl('/hubs/code')
      .withAutomaticReconnect()
      .build()
  }

  useEffect(() => {
    if (!code) return

    let cancelled = false

    const init = async () => {
      const res = await fetch(`/api/snippets/${encodeURIComponent(code)}`)
      if (!res.ok) {
        if (!cancelled) setNotFound(true)
        return
      }
      const data = await res.json()
      if (cancelled) return
      setContent(data.content)
      setLanguage(data.language)

      const conn = buildConnection()
      connectionRef.current = conn

      conn.on('ContentUpdated', (newContent: string) => {
        isRemoteUpdate.current = true
        setContent(newContent)
      })

      conn.on('LanguageUpdated', (newLang: string) => {
        setLanguage(newLang)
      })

      conn.onreconnected(() => {
        conn.invoke('JoinSnippet', code)
        setConnected(true)
      })

      conn.onclose(() => setConnected(false))

      await conn.start()
      await conn.invoke('JoinSnippet', code)
      if (!cancelled) setConnected(true)
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      const conn = connectionRef.current
      if (conn && conn.state === HubConnectionState.Connected) {
        conn.invoke('LeaveSnippet', code).catch(() => {})
        conn.stop()
      }
    }
  }, [code])

  const sendUpdate = useCallback((value: string) => {
    const conn = connectionRef.current
    if (conn?.state === HubConnectionState.Connected && code) {
      conn.invoke('UpdateContent', code, value).catch(console.error)
    }
  }, [code])

  const handleChange = useCallback((value: string) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }
    setContent(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => sendUpdate(value), 300)
  }, [sendUpdate])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    const conn = connectionRef.current
    if (conn?.state === HubConnectionState.Connected && code) {
      conn.invoke('UpdateLanguage', code, newLang).catch(console.error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (notFound) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">Не найдено</h1>
          <p className="text-gray-400">Сниппет с кодом <span className="font-mono text-white">{code}</span> не существует</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            На главную
          </button>
        </div>
      </div>
    )
  }

  const langDef = LANGUAGES[language] ?? LANGUAGES['plaintext']

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Шара
          </button>
          <span className="font-mono text-blue-400 text-sm tracking-wider">{code}</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Подключено' : 'Отключено'} />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="bg-[#3c3c3c] text-gray-300 text-sm rounded px-2 py-1 border-none focus:outline-none"
          >
            {Object.entries(LANGUAGES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 text-sm rounded transition-colors"
          >
            {copied ? '✓ Скопировано' : 'Копировать ссылку'}
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={content}
          height="100%"
          theme={vscodeDark}
          extensions={[langDef.ext()]}
          onChange={handleChange}
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  )
}
