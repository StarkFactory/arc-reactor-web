import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { McpAccessPolicyResponse } from '../../types/api'
import {
  useMcpServers,
  useMcpServerDetail,
  useMcpAccessPolicy,
  useRegisterMcpServer,
  useDeleteMcpServer,
  useConnectMcpServer,
  useDisconnectMcpServer,
  useUpdateMcpAccessPolicy,
  useClearMcpAccessPolicy,
} from '../../hooks/useMcpServers'
import {
  RegisterMcpServerFormSchema,
  EMPTY_REGISTER_FORM,
  type RegisterMcpServerFormInput,
} from '../../schemas/mcp-server'
import './McpServerManager.css'

function splitKeys(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,]+/g)
        .map(s => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  )
}

function isAtlassianServer(tools: string[], name: string): boolean {
  if (name.toLowerCase().includes('atlassian')) return true
  return tools.some(tool => tool.startsWith('jira_') || tool.startsWith('confluence_'))
}

interface PolicyPanelProps {
  serverName: string
  policy: McpAccessPolicyResponse | undefined
  policyLoading: boolean
  onRefresh: () => void
}

function PolicyPanel({ serverName, policy, policyLoading, onRefresh }: PolicyPanelProps) {
  const { t } = useTranslation()
  const [jiraDraft, setJiraDraft] = useState((policy?.allowedJiraProjectKeys ?? []).join('\n'))
  const [confluenceDraft, setConfluenceDraft] = useState(
    (policy?.allowedConfluenceSpaceKeys ?? []).join('\n'),
  )
  const [policyError, setPolicyError] = useState<string | null>(null)

  const updatePolicy = useUpdateMcpAccessPolicy()
  const clearPolicy = useClearMcpAccessPolicy()

  const handleSave = async () => {
    setPolicyError(null)
    try {
      await updatePolicy.mutateAsync({
        name: serverName,
        data: {
          allowedJiraProjectKeys: splitKeys(jiraDraft),
          allowedConfluenceSpaceKeys: splitKeys(confluenceDraft),
        },
      })
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : t('mcp.accessPolicySaveError'))
    }
  }

  const handleReset = async () => {
    setPolicyError(null)
    try {
      await clearPolicy.mutateAsync(serverName)
      onRefresh()
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : t('mcp.accessPolicyResetError'))
    }
  }

  const isBusy = updatePolicy.isPending || clearPolicy.isPending

  return (
    <div className="McpManager-policyPanel">
      <div className="McpManager-policyTitle">{t('mcp.accessPolicyTitle')}</div>
      {policyError && <div className="McpManager-inlineError">{policyError}</div>}
      <div className="McpManager-policyMeta">
        {policyLoading
          ? t('mcp.loading')
          : policy?.dynamicEnabled
            ? t('mcp.accessPolicyDynamic')
            : t('mcp.accessPolicyEnv')}
      </div>

      <div className="McpManager-policyGrid">
        <div>
          <div className="McpManager-detailLabel">{t('mcp.allowedJiraProjects')}</div>
          <textarea
            className="McpManager-textarea"
            rows={5}
            value={jiraDraft}
            onChange={e => setJiraDraft(e.target.value)}
            placeholder={t('mcp.allowedJiraProjectsPlaceholder')}
          />
        </div>
        <div>
          <div className="McpManager-detailLabel">{t('mcp.allowedConfluenceSpaces')}</div>
          <textarea
            className="McpManager-textarea"
            rows={5}
            value={confluenceDraft}
            onChange={e => setConfluenceDraft(e.target.value)}
            placeholder={t('mcp.allowedConfluenceSpacesPlaceholder')}
          />
        </div>
      </div>

      <div className="McpManager-policyActions">
        <button
          className="McpManager-actionBtn"
          onClick={onRefresh}
          disabled={policyLoading || isBusy}
        >
          {policyLoading ? t('mcp.loading') : t('mcp.reloadPolicy')}
        </button>
        <button
          className="McpManager-actionBtn McpManager-actionBtn--connect"
          onClick={handleSave}
          disabled={isBusy}
        >
          {updatePolicy.isPending ? t('mcp.savingPolicy') : t('mcp.savePolicy')}
        </button>
        <button
          className="McpManager-actionBtn McpManager-actionBtn--disconnect"
          onClick={handleReset}
          disabled={isBusy}
        >
          {t('mcp.resetPolicyToEnv')}
        </button>
      </div>
    </div>
  )
}

interface ServerDetailPanelProps {
  serverName: string
}

function ServerDetailPanel({ serverName }: ServerDetailPanelProps) {
  const { t } = useTranslation()
  const { data: detail } = useMcpServerDetail(serverName)
  const tools = detail?.tools ?? []
  const showPolicy = detail ? isAtlassianServer(tools, serverName) : false

  const {
    data: policy,
    isLoading: policyLoading,
    refetch: refetchPolicy,
  } = useMcpAccessPolicy(showPolicy ? serverName : null)

  if (!detail) return null

  return (
    <div className="McpManager-detail">
      {detail.description && (
        <div className="McpManager-detailLabel">{detail.description}</div>
      )}
      {tools.length > 0 && (
        <>
          <div className="McpManager-detailLabel">
            {t('mcp.availableTools')} ({tools.length})
          </div>
          <div className="McpManager-toolList">
            {tools.map(tool => (
              <span key={tool} className="McpManager-toolTag">
                {tool}
              </span>
            ))}
          </div>
        </>
      )}
      {tools.length === 0 && detail.status !== 'CONNECTED' && (
        <div className="McpManager-detailLabel">{t('mcp.connectToSeeTools')}</div>
      )}

      {showPolicy && (
        <PolicyPanel
          serverName={serverName}
          policy={policy}
          policyLoading={policyLoading}
          onRefresh={() => refetchPolicy()}
        />
      )}
    </div>
  )
}

export function McpServerManager() {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [expandedServer, setExpandedServer] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: servers = [], isLoading, error: listError, refetch } = useMcpServers()
  const registerMutation = useRegisterMcpServer()
  const deleteMutation = useDeleteMcpServer()
  const connectMutation = useConnectMcpServer()
  const disconnectMutation = useDisconnectMcpServer()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<RegisterMcpServerFormInput>({
    resolver: zodResolver(RegisterMcpServerFormSchema),
    defaultValues: EMPTY_REGISTER_FORM,
    mode: 'onChange',
  })

  const transport = watch('transport')

  const onSubmit = async (values: RegisterMcpServerFormInput) => {
    setActionError(null)
    const config: Record<string, unknown> = {}
    if (values.transport === 'SSE' || values.transport === 'HTTP') {
      if (values.url.trim()) config.url = values.url.trim()
    } else if (values.transport === 'STDIO') {
      if (values.command.trim()) config.command = values.command.trim()
      if (values.args.trim())
        config.args = values.args
          .split(',')
          .map(a => a.trim())
          .filter(Boolean)
    }
    if (values.adminUrl.trim()) config.adminUrl = values.adminUrl.trim()
    if (values.adminToken.trim()) config.adminToken = values.adminToken.trim()

    try {
      await registerMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        transportType: values.transport,
        config,
        autoConnect: values.autoConnect,
      })
      reset(EMPTY_REGISTER_FORM)
      setShowForm(false)
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        setActionError(t('mcp.duplicateError'))
      } else {
        setActionError(t('mcp.registerError'))
      }
    }
  }

  const handleToggleDetail = (name: string) => {
    setExpandedServer(prev => (prev === name ? null : name))
  }

  const handleConnect = async (name: string) => {
    setActionError(null)
    try {
      await connectMutation.mutateAsync(name)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('mcp.connectError'))
    }
  }

  const handleDisconnect = async (name: string) => {
    setActionError(null)
    try {
      await disconnectMutation.mutateAsync(name)
    } catch {
      setActionError(t('mcp.disconnectError'))
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(t('mcp.deleteConfirm'))) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(name)
      if (expandedServer === name) setExpandedServer(null)
    } catch {
      setActionError(t('mcp.deleteError'))
    }
  }

  const activeActionName =
    connectMutation.isPending || disconnectMutation.isPending || deleteMutation.isPending
      ? (connectMutation.variables ?? disconnectMutation.variables ?? deleteMutation.variables)
      : null

  if (isLoading) {
    return <div className="McpManager-loading">{t('mcp.loading')}</div>
  }

  if (listError && servers.length === 0 && !showForm) {
    return (
      <div className="McpManager-error">
        <span>{t('mcp.loadError')}</span>
        <button className="McpManager-retryBtn" onClick={() => refetch()}>
          {t('mcp.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="McpManager">
      <div className="McpManager-header">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {servers.length > 0 ? t('mcp.serverCount', { count: servers.length }) : ''}
        </span>
        <button
          className="McpManager-addBtn"
          onClick={() => setShowForm(!showForm)}
          title={showForm ? t('mcp.close') : t('mcp.add')}
        >
          {showForm ? '\u00d7' : '+'}
        </button>
      </div>

      {/* Register form */}
      {showForm && (
        <form className="McpManager-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="McpManager-formTitle">{t('mcp.registerTitle')}</div>
          <input
            className="McpManager-input"
            {...register('name')}
            placeholder={t('mcp.namePlaceholder')}
          />
          {errors.name && <span className="McpManager-fieldError">{errors.name.message}</span>}

          <select className="McpManager-select" {...register('transport')}>
            <option value="SSE">SSE</option>
            <option value="STDIO">STDIO</option>
            <option value="HTTP">HTTP</option>
          </select>

          {(transport === 'SSE' || transport === 'HTTP') && (
            <>
              <input
                className="McpManager-input"
                {...register('url')}
                placeholder={t('mcp.urlPlaceholder')}
              />
              {errors.url && <span className="McpManager-fieldError">{errors.url.message}</span>}
            </>
          )}

          <input
            className="McpManager-input"
            {...register('adminUrl')}
            placeholder={t('mcp.adminUrlPlaceholder')}
          />

          <input
            className="McpManager-input"
            {...register('adminToken')}
            placeholder={t('mcp.adminTokenPlaceholder')}
          />

          {transport === 'STDIO' && (
            <>
              <input
                className="McpManager-input"
                {...register('command')}
                placeholder={t('mcp.commandPlaceholder')}
              />
              {errors.command && (
                <span className="McpManager-fieldError">{errors.command.message}</span>
              )}
              <input
                className="McpManager-input"
                {...register('args')}
                placeholder={t('mcp.argsPlaceholder')}
              />
            </>
          )}

          <input
            className="McpManager-input"
            {...register('description')}
            placeholder={t('mcp.descriptionPlaceholder')}
          />

          <label className="McpManager-checkLabel">
            <input type="checkbox" {...register('autoConnect')} />
            {t('mcp.autoConnect')}
          </label>

          <div className="McpManager-formActions">
            <button
              type="submit"
              className="McpManager-saveBtn"
              disabled={registerMutation.isPending || !isValid}
            >
              {registerMutation.isPending ? t('mcp.registering') : t('mcp.register')}
            </button>
            <button type="button" className="McpManager-cancelBtn" onClick={() => setShowForm(false)}>
              {t('mcp.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Server list */}
      {servers.length === 0 && !showForm ? (
        <div className="McpManager-empty">{t('mcp.noServers')}</div>
      ) : (
        <div className="McpManager-list">
          {servers.map(server => (
            <div key={server.id} className="McpManager-card">
              <div
                className="McpManager-cardTop"
                onClick={() => handleToggleDetail(server.name)}
                style={{ cursor: 'pointer' }}
              >
                <span className="McpManager-cardName">{server.name}</span>
                <span
                  className={`McpManager-badge McpManager-badge--status McpManager-badge--${server.status}`}
                >
                  {server.status}
                </span>
              </div>

              <div className="McpManager-cardMeta">
                <span className="McpManager-badge McpManager-badge--transport">
                  {server.transportType}
                </span>
                {server.toolCount > 0 && (
                  <span className="McpManager-toolCount">
                    {t('mcp.toolCount', { count: server.toolCount })}
                  </span>
                )}
              </div>

              <div className="McpManager-cardActions">
                {server.status === 'CONNECTED' ? (
                  <button
                    className="McpManager-actionBtn McpManager-actionBtn--disconnect"
                    onClick={() => handleDisconnect(server.name)}
                    disabled={activeActionName === server.name}
                  >
                    {activeActionName === server.name ? '...' : t('mcp.disconnect')}
                  </button>
                ) : (
                  <button
                    className="McpManager-actionBtn McpManager-actionBtn--connect"
                    onClick={() => handleConnect(server.name)}
                    disabled={activeActionName === server.name}
                  >
                    {activeActionName === server.name ? '...' : t('mcp.connect')}
                  </button>
                )}
                <button
                  className="McpManager-actionBtn McpManager-actionBtn--delete"
                  onClick={() => handleDelete(server.name)}
                  disabled={activeActionName === server.name}
                >
                  {t('mcp.delete')}
                </button>
              </div>

              {expandedServer === server.name && (
                <ServerDetailPanel serverName={server.name} />
              )}
            </div>
          ))}
        </div>
      )}

      {actionError && <div className="McpManager-inlineError">{actionError}</div>}
    </div>
  )
}
