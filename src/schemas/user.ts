import { z } from 'zod'

export const UserRoleSchema = z.enum(['USER', 'ADMIN'])

export const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  active: z.boolean(),
  createdAt: z.number(),
})

export const AdminUserListSchema = z.object({
  content: z.array(AdminUserSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  page: z.number(),
  size: z.number(),
})

export type AdminUser = z.infer<typeof AdminUserSchema>
