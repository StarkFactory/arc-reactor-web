import './ToolIndicator.css'

interface ToolIndicatorProps {
  toolName: string
}

export function ToolIndicator({ toolName }: ToolIndicatorProps) {
  return (
    <div className="ToolIndicator">
      <span className="ToolIndicator-spinner" />
      <span>도구 사용 중: {toolName}</span>
    </div>
  )
}
