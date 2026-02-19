import { z } from 'zod'

export const McpServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  transportType: z.string(),
  autoConnect: z.boolean(),
  status: z.string(),
  toolCount: z.number().int(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const McpServerDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  transportType: z.string(),
  config: z.record(z.string(), z.unknown()),
  version: z.string().nullable(),
  autoConnect: z.boolean(),
  status: z.string(),
  tools: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const RegisterMcpServerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  transportType: z.string().min(1, 'Transport type is required'),
  config: z.record(z.string(), z.unknown()),
  autoConnect: z.boolean().optional(),
})

export const UpdateMcpServerSchema = z.object({
  description: z.string().optional(),
  transportType: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  autoConnect: z.boolean().optional(),
})

export const McpAccessPolicySchema = z.object({
  ok: z.boolean(),
  dynamicEnabled: z.boolean().optional(),
  allowedJiraProjectKeys: z.array(z.string()),
  allowedConfluenceSpaceKeys: z.array(z.string()),
})

export const UpdateMcpAccessPolicySchema = z.object({
  allowedJiraProjectKeys: z.array(z.string()),
  allowedConfluenceSpaceKeys: z.array(z.string()),
})

export type McpServer = z.infer<typeof McpServerSchema>
export type McpServerDetail = z.infer<typeof McpServerDetailSchema>
export type RegisterMcpServerInput = z.infer<typeof RegisterMcpServerSchema>
export type UpdateMcpServerInput = z.infer<typeof UpdateMcpServerSchema>
export type McpAccessPolicy = z.infer<typeof McpAccessPolicySchema>
export type UpdateMcpAccessPolicyInput = z.infer<typeof UpdateMcpAccessPolicySchema>
