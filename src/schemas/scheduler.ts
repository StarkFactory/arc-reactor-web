import { z } from 'zod'

function isValidJsonObject(text: string): boolean {
  const raw = text.trim()
  if (!raw || raw === '{}') return true
  try {
    const v = JSON.parse(raw)
    return v !== null && !Array.isArray(v) && typeof v === 'object'
  } catch {
    return false
  }
}

export const SchedulerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string(),
  mcpServerName: z.string().min(1, 'MCP server is required'),
  toolName: z.string().min(1, 'Tool name is required'),
  toolArgsText: z.string().refine(isValidJsonObject, { message: 'Tool arguments must be a valid JSON object' }),
  slackChannelId: z.string(),
  enabled: z.boolean(),
})

export type SchedulerFormInput = z.infer<typeof SchedulerFormSchema>

export const EMPTY_SCHEDULER_FORM: SchedulerFormInput = {
  name: '',
  description: '',
  cronExpression: '',
  timezone: 'Asia/Seoul',
  mcpServerName: '',
  toolName: '',
  toolArgsText: '{}',
  slackChannelId: '',
  enabled: true,
}
