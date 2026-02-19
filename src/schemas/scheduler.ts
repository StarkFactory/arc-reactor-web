import { z } from 'zod'

export const ScheduledJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cronExpression: z.string(),
  timezone: z.string(),
  mcpServerName: z.string(),
  toolName: z.string(),
  toolArguments: z.record(z.string(), z.unknown()),
  slackChannelId: z.string().nullable(),
  enabled: z.boolean(),
  lastRunAt: z.number().nullable(),
  lastStatus: z.string().nullable(),
  lastResult: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateScheduledJobSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().optional(),
  mcpServerName: z.string().min(1, 'MCP server is required'),
  toolName: z.string().min(1, 'Tool name is required'),
  toolArguments: z.record(z.string(), z.unknown()).optional(),
  slackChannelId: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
})

export const UpdateScheduledJobSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().optional(),
  mcpServerName: z.string().min(1, 'MCP server is required'),
  toolName: z.string().min(1, 'Tool name is required'),
  toolArguments: z.record(z.string(), z.unknown()).optional(),
  slackChannelId: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
})

export type ScheduledJob = z.infer<typeof ScheduledJobSchema>
export type CreateScheduledJobInput = z.infer<typeof CreateScheduledJobSchema>
export type UpdateScheduledJobInput = z.infer<typeof UpdateScheduledJobSchema>
