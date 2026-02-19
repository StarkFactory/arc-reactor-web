import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import './ChatInput.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = 'image/*,audio/*,video/*'

interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void
  onStop: () => void
  disabled: boolean
  initialValue?: string
}

export function ChatInput({ onSend, onStop, disabled, initialValue }: ChatInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync initialValue during render (avoids setState-in-effect)
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue)
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue)
    if (initialValue) setInput(initialValue)
  }

  // Focus when initialValue changes or loading finishes
  useEffect(() => {
    if (initialValue) inputRef.current?.focus()
  }, [initialValue])

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  // Revoke object URLs on unmount or when files change
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previews])

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const validFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(newFiles).forEach(file => {
      if (file.size > MAX_FILE_SIZE) return
      validFiles.push(file)
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file))
      } else {
        newPreviews.push('')
      }
    })

    setFiles(prev => [...prev, ...validFiles])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setPreviews(prev => {
      if (prev[index]) URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    previews.forEach(url => { if (url) URL.revokeObjectURL(url) })
    setFiles([])
    setPreviews([])
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || disabled) return
    onSend(text, files.length > 0 ? files : undefined)
    setInput('')
    clearFiles()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <form className="ChatInput" onSubmit={handleSubmit}>
      {files.length > 0 && (
        <div className="ChatInput-previews">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="ChatInput-preview">
              {previews[i] ? (
                <img src={previews[i]} alt={file.name} />
              ) : (
                <span className="ChatInput-previewName">{file.name}</span>
              )}
              <button
                type="button"
                className="ChatInput-previewRemove"
                onClick={() => removeFile(i)}
                aria-label={t('attachment.remove')}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="ChatInput-inputRow">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="ChatInput-attachBtn"
          onClick={handleAttachClick}
          disabled={disabled}
          title={t('attachment.add')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={1}
          disabled={disabled}
        />
        {disabled ? (
          <button type="button" className="ChatInput-stopBtn" onClick={onStop}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1.5" />
            </svg>
            {t('chat.stop')}
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()}>
            {t('chat.send')}
          </button>
        )}
      </div>
    </form>
  )
}
