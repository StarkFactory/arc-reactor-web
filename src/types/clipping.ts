// ---- Clipping MCP Server Types ----

export interface ClippingCategory {
  id: string
  name: string
  maxItems: number
  personaId: string | null
  createdAt: string
}

export interface CreateClippingCategoryRequest {
  name: string
  maxItems?: number
  personaId?: string
}

export interface ClippingSource {
  id: string
  name: string
  url: string
  categoryId: string
  isActive: boolean
  crawlApproved: boolean
  approvedBy: string | null
  approvedAt: string | null
  verificationStatus: string
  reliabilityScore: number
  lastCrawlError: string | null
  crawlFailCount: number
  createdAt: string
}

export interface CreateClippingSourceRequest {
  name: string
  url: string
  categoryId: string
}

export interface UpdateClippingSourceRequest {
  name: string
  url: string
  categoryId: string
}

export interface ClippingPersona {
  id: string
  name: string
  description: string | null
  systemPrompt: string
  summaryStyle: string | null
  targetAudience: string | null
  maxItems: number
  language: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClippingPersonaRequest {
  name: string
  systemPrompt: string
  description?: string
  summaryStyle?: string
  targetAudience?: string
  maxItems?: number
  language?: string
}

export interface UpdateClippingPersonaRequest {
  name: string
  systemPrompt: string
  description?: string
  summaryStyle?: string
  targetAudience?: string
  maxItems?: number
  language?: string
  isActive?: boolean
}

export interface ClippingStat {
  id: string
  categoryId: string
  statDate: string
  itemsCollected: number
  itemsSummarized: number
  itemsSent: number
  topKeywords: string[]
  avgImportanceScore: number
  createdAt: string
}
