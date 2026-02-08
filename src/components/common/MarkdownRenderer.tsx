import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import './MarkdownRenderer.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="MarkdownRenderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')

            // Block code (has language class or is multi-line)
            if (match || codeString.includes('\n')) {
              return (
                <CodeBlock language={match?.[1]}>
                  {codeString}
                </CodeBlock>
              )
            }

            // Inline code
            return (
              <code className="MarkdownRenderer-inlineCode" {...props}>
                {children}
              </code>
            )
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
