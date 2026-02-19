import { describe, it, expect } from 'vitest'
import {
  PersonaSchema,
  CreatePersonaSchema,
  IntentSchema,
  CreateIntentSchema,
  McpServerSchema,
  RegisterMcpServerSchema,
  McpAccessPolicySchema,
  OutputGuardRuleSchema,
  CreateOutputGuardRuleSchema,
  ScheduledJobSchema,
  CreateScheduledJobSchema,
} from '../index'

describe('PersonaSchema', () => {
  const valid = {
    id: 'p-1',
    name: 'Support Bot',
    systemPrompt: 'You are a support agent.',
    isDefault: false,
    createdAt: 1700000000,
    updatedAt: 1700000001,
  }

  it('accepts a valid persona', () => {
    expect(PersonaSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a persona missing the name field', () => {
    const withoutName = { id: valid.id, systemPrompt: valid.systemPrompt, isDefault: valid.isDefault, createdAt: valid.createdAt, updatedAt: valid.updatedAt }
    expect(PersonaSchema.safeParse(withoutName).success).toBe(false)
  })
})

describe('CreatePersonaSchema', () => {
  it('rejects an empty name', () => {
    const result = CreatePersonaSchema.safeParse({ name: '', systemPrompt: 'ok' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid creation payload', () => {
    const result = CreatePersonaSchema.safeParse({ name: 'Bot', systemPrompt: 'You are a bot.' })
    expect(result.success).toBe(true)
  })
})

describe('IntentSchema', () => {
  const valid = {
    name: 'greet',
    description: 'Greet the user',
    examples: ['hello', 'hi'],
    keywords: ['greet'],
    profile: {
      model: null,
      temperature: null,
      maxToolCalls: null,
      allowedTools: null,
      systemPrompt: null,
      responseFormat: null,
    },
    enabled: true,
    createdAt: 1700000000,
    updatedAt: 1700000001,
  }

  it('accepts a valid intent', () => {
    expect(IntentSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid responseFormat in profile', () => {
    const bad = { ...valid, profile: { ...valid.profile, responseFormat: 'XML' } }
    expect(IntentSchema.safeParse(bad).success).toBe(false)
  })
})

describe('CreateIntentSchema', () => {
  it('requires both name and description', () => {
    expect(CreateIntentSchema.safeParse({ name: 'ok' }).success).toBe(false)
    expect(CreateIntentSchema.safeParse({ description: 'ok' }).success).toBe(false)
  })
})

describe('McpServerSchema', () => {
  it('accepts a valid MCP server', () => {
    const valid = {
      id: 's-1',
      name: 'Jira',
      description: null,
      transportType: 'HTTP',
      autoConnect: true,
      status: 'CONNECTED',
      toolCount: 5,
      createdAt: 1700000000,
      updatedAt: 1700000001,
    }
    expect(McpServerSchema.safeParse(valid).success).toBe(true)
  })
})

describe('RegisterMcpServerSchema', () => {
  it('requires name and transportType', () => {
    expect(RegisterMcpServerSchema.safeParse({ name: '', transportType: 'HTTP', config: {} }).success).toBe(false)
    expect(RegisterMcpServerSchema.safeParse({ name: 'Jira', transportType: '', config: {} }).success).toBe(false)
  })

  it('accepts a valid registration payload', () => {
    const result = RegisterMcpServerSchema.safeParse({
      name: 'Jira',
      transportType: 'HTTP',
      config: { url: 'https://jira.example.com' },
    })
    expect(result.success).toBe(true)
  })
})

describe('McpAccessPolicySchema', () => {
  it('accepts a valid policy', () => {
    const result = McpAccessPolicySchema.safeParse({
      ok: true,
      allowedJiraProjectKeys: ['PROJ'],
      allowedConfluenceSpaceKeys: ['WIKI'],
    })
    expect(result.success).toBe(true)
  })
})

describe('OutputGuardRuleSchema', () => {
  it('accepts a valid rule', () => {
    const valid = {
      id: 'r-1',
      name: 'Block PII',
      pattern: '\\d{13}',
      action: 'BLOCK',
      priority: 1,
      enabled: true,
      createdAt: 1700000000,
      updatedAt: 1700000001,
    }
    expect(OutputGuardRuleSchema.safeParse(valid).success).toBe(true)
  })
})

describe('CreateOutputGuardRuleSchema', () => {
  it('requires name and pattern', () => {
    expect(CreateOutputGuardRuleSchema.safeParse({ name: 'ok' }).success).toBe(false)
    expect(CreateOutputGuardRuleSchema.safeParse({ pattern: '.*' }).success).toBe(false)
  })
})

describe('ScheduledJobSchema', () => {
  it('accepts a valid scheduled job', () => {
    const valid = {
      id: 'j-1',
      name: 'Nightly Report',
      description: null,
      cronExpression: '0 0 * * *',
      timezone: 'UTC',
      mcpServerName: 'jira',
      toolName: 'generate_report',
      toolArguments: {},
      slackChannelId: null,
      enabled: true,
      lastRunAt: null,
      lastStatus: null,
      lastResult: null,
      createdAt: 1700000000,
      updatedAt: 1700000001,
    }
    expect(ScheduledJobSchema.safeParse(valid).success).toBe(true)
  })
})

describe('CreateScheduledJobSchema', () => {
  it('requires name, cronExpression, mcpServerName, toolName', () => {
    const base = { name: 'Job', cronExpression: '* * * * *', mcpServerName: 'svc', toolName: 'tool' }
    expect(CreateScheduledJobSchema.safeParse(base).success).toBe(true)
    expect(CreateScheduledJobSchema.safeParse({ ...base, name: '' }).success).toBe(false)
    expect(CreateScheduledJobSchema.safeParse({ ...base, cronExpression: '' }).success).toBe(false)
  })
})
