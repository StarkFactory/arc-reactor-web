import { z } from 'zod'

export const AdminAuditLogSchema = z.object({
  id: z.string(),
  category: z.string(),
  action: z.string(),
  actor: z.string(),
  resourceId: z.string().nullable(),
  detail: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.number(),
})

export const AuditLogsPageSchema = z.object({
  content: z.array(AdminAuditLogSchema),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
})

export type AdminAuditLog = z.infer<typeof AdminAuditLogSchema>
