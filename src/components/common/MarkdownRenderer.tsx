import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import './MarkdownRenderer.css'

// Fix CommonMark emphasis edge case: closing ** preceded by punctuation
// (e.g. parenthesis) and followed by CJK is not recognized as right-flanking.
// Insert zero-width space before closing ** so preceding char is non-punctuation.
const CJK_BOLD_FIX_RE = /(\*\*[^*]+?[)}\]:.!?;,])(\*\*(?=[가-힣ぁ-んァ-ヶ\u4e00-\u9fff]))/g

function preprocessMarkdown(text: string): string {
  return text.replace(CJK_BOLD_FIX_RE, '$1\u200B$2')
}

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
        {preprocessMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}
