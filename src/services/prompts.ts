import type {
  TemplateResponse,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  VersionResponse,
  CreateVersionRequest,
} from '../types/api'
import { api } from '../lib/http'

export const listTemplates = (): Promise<TemplateResponse[]> =>
  api.get('prompt-templates').json()

export const getTemplate = (id: string): Promise<TemplateDetailResponse> =>
  api.get(`prompt-templates/${id}`).json()

export const createTemplate = (request: CreateTemplateRequest): Promise<TemplateResponse> =>
  api.post('prompt-templates', { json: request }).json()

export const updateTemplate = (id: string, request: UpdateTemplateRequest): Promise<TemplateResponse> =>
  api.put(`prompt-templates/${id}`, { json: request }).json()

export const deleteTemplate = (id: string): Promise<void> =>
  api.delete(`prompt-templates/${id}`).then(() => undefined)

export const createVersion = (templateId: string, request: CreateVersionRequest): Promise<VersionResponse> =>
  api.post(`prompt-templates/${templateId}/versions`, { json: request }).json()

export const activateVersion = (templateId: string, versionId: string): Promise<VersionResponse> =>
  api.put(`prompt-templates/${templateId}/versions/${versionId}/activate`).json()

export const archiveVersion = (templateId: string, versionId: string): Promise<VersionResponse> =>
  api.put(`prompt-templates/${templateId}/versions/${versionId}/archive`).json()
