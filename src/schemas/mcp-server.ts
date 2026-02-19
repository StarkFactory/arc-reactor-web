import { z } from 'zod'

export const RegisterMcpServerFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    transport: z.enum(['SSE', 'STDIO', 'HTTP']),
    url: z.string(),
    adminUrl: z.string(),
    adminToken: z.string(),
    command: z.string(),
    args: z.string(),
    description: z.string(),
    autoConnect: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if ((data.transport === 'SSE' || data.transport === 'HTTP') && !data.url.trim()) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'URL is required for SSE/HTTP transport' })
    }
    if (data.transport === 'STDIO' && !data.command.trim()) {
      ctx.addIssue({ code: 'custom', path: ['command'], message: 'Command is required for STDIO transport' })
    }
  })

export type RegisterMcpServerFormInput = z.infer<typeof RegisterMcpServerFormSchema>

export const EMPTY_REGISTER_FORM: RegisterMcpServerFormInput = {
  name: '',
  transport: 'SSE',
  url: '',
  adminUrl: '',
  adminToken: '',
  command: '',
  args: '',
  description: '',
  autoConnect: true,
}
