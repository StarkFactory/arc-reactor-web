import { useState, useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './CodeBlock.css'

interface CodeBlockProps {
  language?: string
  children: string
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [children])

  return (
    <div className="CodeBlock">
      <div className="CodeBlock-header">
        <span className="CodeBlock-lang">{language || 'code'}</span>
        <button className="CodeBlock-copyBtn" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '0.85rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}
