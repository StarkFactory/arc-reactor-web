import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClippingStat, ClippingCategory } from '../../../types/clipping'
import { getClippingMonthlyStats, listClippingCategories } from '../../../services/clipping'
import './ClippingStatsPage.css'

export function ClippingStatsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<ClippingStat[]>([])
  const [categories, setCategories] = useState<ClippingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [categoryId, setCategoryId] = useState('')

  const fetchCategories = async () => {
    try {
      setCategories(await listClippingCategories())
    } catch {
      // ignore
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true); setError(null)
      setStats(await getClippingMonthlyStats(yearMonth, categoryId || undefined))
    } catch {
      setError(t('admin.clipping.stats.loadError'))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  // Use a ref to always hold the latest fetchStats without making it a
  // dependency, so the effect only re-runs when the filter inputs change.
  const fetchStatsRef = useRef(fetchStats)
  fetchStatsRef.current = fetchStats
  useEffect(() => { fetchStatsRef.current() }, [yearMonth, categoryId])

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name || id

  const totals = stats.reduce(
    (acc, s) => ({
      collected: acc.collected + s.itemsCollected,
      summarized: acc.summarized + s.itemsSummarized,
      sent: acc.sent + s.itemsSent,
    }),
    { collected: 0, summarized: 0, sent: 0 }
  )

  return (
    <div className="ClipStatsPage">
      <div className="ClipStatsPage-header">
        <div>
          <h1 className="ClipStatsPage-title">{t('admin.clipping.stats.title')}</h1>
          <p className="ClipStatsPage-desc">{t('admin.clipping.stats.description')}</p>
        </div>
      </div>

      <div className="ClipStatsPage-filters">
        <div className="ClipStatsPage-field">
          <label className="ClipStatsPage-label">{t('admin.clipping.stats.month')}</label>
          <input className="ClipStatsPage-input" type="month" value={yearMonth}
            onChange={e => setYearMonth(e.target.value)} />
        </div>
        <div className="ClipStatsPage-field">
          <label className="ClipStatsPage-label">{t('admin.clipping.stats.category')}</label>
          <select className="ClipStatsPage-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">{t('admin.clipping.stats.allCategories')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="ClipStatsPage-error">{error}</div>}

      {!loading && stats.length > 0 && (
        <div className="ClipStatsPage-totals">
          <div className="ClipStatsPage-totalCard">
            <div className="ClipStatsPage-totalValue">{totals.collected}</div>
            <div className="ClipStatsPage-totalLabel">{t('admin.clipping.stats.collected')}</div>
          </div>
          <div className="ClipStatsPage-totalCard">
            <div className="ClipStatsPage-totalValue">{totals.summarized}</div>
            <div className="ClipStatsPage-totalLabel">{t('admin.clipping.stats.summarized')}</div>
          </div>
          <div className="ClipStatsPage-totalCard">
            <div className="ClipStatsPage-totalValue">{totals.sent}</div>
            <div className="ClipStatsPage-totalLabel">{t('admin.clipping.stats.sent')}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ClipStatsPage-loading">{t('admin.clipping.stats.loading')}</div>
      ) : stats.length === 0 ? (
        <div className="ClipStatsPage-empty">{t('admin.clipping.stats.empty')}</div>
      ) : (
        <div className="ClipStatsPage-table">
          <table>
            <thead>
              <tr>
                <th>{t('admin.clipping.stats.date')}</th>
                <th>{t('admin.clipping.stats.category')}</th>
                <th>{t('admin.clipping.stats.collected')}</th>
                <th>{t('admin.clipping.stats.summarized')}</th>
                <th>{t('admin.clipping.stats.sent')}</th>
                <th>{t('admin.clipping.stats.avgScore')}</th>
                <th>{t('admin.clipping.stats.keywords')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id}>
                  <td>{s.statDate}</td>
                  <td>{categoryName(s.categoryId)}</td>
                  <td>{s.itemsCollected}</td>
                  <td>{s.itemsSummarized}</td>
                  <td>{s.itemsSent}</td>
                  <td>{s.avgImportanceScore.toFixed(2)}</td>
                  <td>
                    {s.topKeywords.length > 0 && (
                      <div className="ClipStatsPage-keywords">
                        {s.topKeywords.map((kw, i) => (
                          <span key={i} className="ClipStatsPage-keyword">{kw}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
