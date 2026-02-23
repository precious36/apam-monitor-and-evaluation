import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const CASE_STATUS_COLORS = ['#008bb8', '#2e7d32', '#c48b18', '#c25b3f', '#61758d', '#00a0d8', '#705e9c']
const GENDER_COLORS = ['#00a0d8', '#2379c8', '#2e7d32', '#c48b18']
const CHART_GRID_STROKE = 'rgba(114, 132, 154, 0.14)'
const CHART_AXIS_TICK = { fill: '#72849a', fontSize: 12, fontWeight: 500 }
const CHART_BAR_TOOLTIP_CURSOR = { fill: 'rgba(107, 124, 147, 0.07)' }
const CHART_LINE_TOOLTIP_CURSOR = { stroke: 'rgba(107, 124, 147, 0.26)', strokeDasharray: '4 6' }
const EMPTY_LIST = []
const EMPTY_SUMMARY = {
  totalMembers: 0,
  employedMembers: 0,
  unemployedMembers: 0,
  membersWithKnownEmploymentStatus: 0,
  employmentRatePercent: 0,
  totalCases: 0,
  activeCases: 0,
  criticalCases: 0,
  closedCases: 0,
  membersLinkedToCases: 0,
}

const getApiErrorMessage = (payload, status, fallbackMessage) => {
  if (payload?.errors?.length) {
    return payload.errors[0]
  }

  if (payload?.message) {
    return payload.message
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  return fallbackMessage
}

const formatPercent = (value) => `${Math.round(value)}%`
const formatInteger = (value) => Number(value ?? 0).toLocaleString()
const truncateLabel = (value, max = 16) => {
  const label = String(value ?? '')
  return label.length > max ? `${label.slice(0, Math.max(max - 1, 1))}...` : label
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="chart-tooltip">
      {label ? <p className="chart-tooltip-label">{label}</p> : null}
      <ul className="chart-tooltip-list">
        {payload.map((entry) => (
          <li key={`${entry.dataKey}-${entry.name}`} className="chart-tooltip-item">
            <span className="chart-tooltip-dot" style={{ backgroundColor: entry.color ?? '#00a0d8' }} />
            <span>{entry.name ?? entry.dataKey}</span>
            <strong>{formatInteger(entry.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DashboardLegend({ payload = [] }) {
  if (!payload.length) {
    return null
  }

  return (
    <ul className="chart-legend-list">
      {payload.map((entry) => (
        <li key={`${entry.value}-${entry.color}`} className="chart-legend-item">
          <span className="chart-legend-color" style={{ backgroundColor: entry.color ?? '#00a0d8' }} />
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Dashboard({ session }) {
  const notify = useNotify()
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/analytics`, {
        headers: authHeader,
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.succeeded || !payload?.data) {
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load dashboard analytics.'))
      }

      setAnalytics(payload.data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data.'
      setAnalytics(null)
      setPageError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [authHeader, notify])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const summary = analytics?.summary ?? EMPTY_SUMMARY
  const membersByDistrictData = analytics?.membersByDistrict ?? EMPTY_LIST
  const casesByTypeData = analytics?.casesByType ?? EMPTY_LIST
  const casesByStatusData = analytics?.casesByStatus ?? EMPTY_LIST
  const membersByGenderData = analytics?.membersByGender ?? EMPTY_LIST
  const monthlyTrendData = analytics?.casesMonthlyTrend ?? EMPTY_LIST
  const topDistrict = useMemo(() => {
    if (!membersByDistrictData.length) {
      return null
    }

    return membersByDistrictData.reduce((highest, item) =>
      Number(item.value ?? 0) > Number(highest.value ?? 0) ? item : highest
    )
  }, [membersByDistrictData])
  const peakTrendPoint = useMemo(() => {
    if (!monthlyTrendData.length) {
      return null
    }

    return monthlyTrendData.reduce((peak, item) =>
      Number(item.value ?? 0) > Number(peak.value ?? 0) ? item : peak
    )
  }, [monthlyTrendData])
  const totalCasesFromStatus = useMemo(
    () => casesByStatusData.reduce((total, item) => total + Number(item.value ?? 0), 0),
    [casesByStatusData]
  )
  const districtAxisMax = useMemo(() => {
    const maxValue = membersByDistrictData.reduce(
      (highest, item) => Math.max(highest, Number(item.value ?? 0)),
      0
    )

    if (maxValue <= 2) {
      return 2
    }

    if (maxValue <= 5) {
      return maxValue + 1
    }

    return Math.ceil(maxValue * 1.15)
  }, [membersByDistrictData])
  const hasFewCaseTypeBars = casesByTypeData.length > 0 && casesByTypeData.length <= 3
  const hasFewGenderBars = membersByGenderData.length > 0 && membersByGenderData.length <= 3
  const hasFewDistrictBars = membersByDistrictData.length > 0 && membersByDistrictData.length <= 3
  const activeCaseRate =
    summary.totalCases > 0 ? Math.round((summary.activeCases / summary.totalCases) * 100) : 0
  const generatedAt = analytics?.generatedAtUtc
    ? new Date(analytics.generatedAtUtc).toLocaleString()
    : null

  return (
    <div className="page dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Monitoring and Evaluation</p>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Real-time analytics across member registry and case management records.
          </p>
          {generatedAt ? <p className="table-meta">Last updated: {generatedAt}</p> : null}
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={loadDashboard} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh data'}
          </Button>
        </div>
      </div>

      {pageError ? (
        <p className="alert" role="alert">
          {pageError}
        </p>
      ) : null}

      <section className="grid-metrics">
        <Card
          className="metric-card metric-card-kpi metric-card--blue reveal"
          title="Total members"
          subtitle="Active registry"
        >
          <div className="metric-value">{formatInteger(summary.totalMembers)}</div>
          <p className="metric-meta">Live count from member records</p>
        </Card>
        <Card
          className="metric-card metric-card-kpi metric-card--green reveal"
          title="Employment split"
          subtitle="Known status"
        >
          <div className="split-meter">
            <div className="split-meter-bar">
              <span style={{ width: `${summary.employmentRatePercent}%` }} />
            </div>
            <div className="split-meter-labels">
              <span>Employed {formatPercent(summary.employmentRatePercent)}</span>
              <span>Unemployed {formatPercent(100 - summary.employmentRatePercent)}</span>
            </div>
          </div>
          <p className="metric-meta">
            {formatInteger(summary.employedMembers)} employed, {formatInteger(summary.unemployedMembers)} unemployed
          </p>
        </Card>
        <Card
          className="metric-card metric-card-kpi metric-card--amber reveal"
          title="Active cases"
          subtitle="Open investigations"
        >
          <div className="metric-value">{formatInteger(summary.activeCases)}</div>
          <p className="metric-meta">{formatInteger(summary.criticalCases)} marked critical</p>
        </Card>
        <Card
          className="metric-card metric-card-kpi metric-card--teal reveal"
          title="Closed cases"
          subtitle="Resolved outcomes"
        >
          <div className="metric-value">{formatInteger(summary.closedCases)}</div>
          <p className="metric-meta">Cases with final outcomes</p>
        </Card>
        <Card
          className="metric-card metric-card-kpi metric-card--slate reveal"
          title="Case-linked members"
          subtitle="Member-case links"
        >
          <div className="metric-value">{formatInteger(summary.membersLinkedToCases)}</div>
          <p className="metric-meta">Unique members referenced in case records</p>
        </Card>
      </section>

      <section className="dashboard-charts-grid">
        <Card
          title="Cases by Type"
          subtitle="Distribution by category"
          action={<span className="chart-card-badge">{formatInteger(summary.totalCases)} total</span>}
          className="chart-card chart-card-cases-type reveal"
        >
          {casesByTypeData.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={casesByTypeData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 2 }}
                  barCategoryGap={hasFewCaseTypeBars ? '4%' : '16%'}
                >
                  <defs>
                    <linearGradient id="casesTypeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6474ff" />
                      <stop offset="100%" stopColor="#4759f4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 7" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={CHART_AXIS_TICK}
                    padding={hasFewCaseTypeBars ? { left: 8, right: 8 } : { left: 2, right: 2 }}
                    tickFormatter={(value) => truncateLabel(value, 12)}
                    interval="preserveStartEnd"
                    minTickGap={20}
                    height={34}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    width={34}
                    tick={CHART_AXIS_TICK}
                  />
                  <Tooltip content={<DashboardTooltip />} cursor={CHART_BAR_TOOLTIP_CURSOR} />
                  <Bar
                    dataKey="value"
                    name="Cases"
                    fill="url(#casesTypeGradient)"
                    radius={[12, 12, 4, 4]}
                    barSize={hasFewCaseTypeBars ? 52 : undefined}
                    maxBarSize={hasFewCaseTypeBars ? 56 : 36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="table-meta">No case data available.</p>
          )}
        </Card>

        <Card
          title="Members by District"
          subtitle="Top districts in registry"
          action={
            <span className="chart-card-badge">
              {topDistrict
                ? `${truncateLabel(topDistrict.label, 12)}: ${formatInteger(topDistrict.value)}`
                : `${formatInteger(summary.totalMembers)} total`}
            </span>
          }
          className="chart-card chart-card-members-district reveal"
        >
          {membersByDistrictData.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={membersByDistrictData}
                  layout="vertical"
                  margin={{ top: 6, right: 12, left: 4, bottom: 0 }}
                  barCategoryGap={hasFewDistrictBars ? '10%' : '22%'}
                >
                  <defs>
                    <linearGradient id="districtGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#59c9ff" />
                      <stop offset="100%" stopColor="#2e9dff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 7" stroke={CHART_GRID_STROKE} horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    domain={[0, districtAxisMax]}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={CHART_AXIS_TICK}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={112}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={CHART_AXIS_TICK}
                    tickFormatter={(value) => truncateLabel(value, 12)}
                  />
                  <Tooltip content={<DashboardTooltip />} cursor={CHART_BAR_TOOLTIP_CURSOR} />
                  <Bar
                    dataKey="value"
                    name="Members"
                    fill="url(#districtGradient)"
                    radius={[0, 10, 10, 0]}
                    barSize={hasFewDistrictBars ? 22 : 18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="table-meta">No member district data available.</p>
          )}
        </Card>

        <Card
          title="Cases by Status"
          subtitle="Operational status mix"
          action={<span className="chart-card-badge">{formatPercent(activeCaseRate)} active</span>}
          className="chart-card chart-card-cases-status reveal"
        >
          {casesByStatusData.length > 0 ? (
            <div className="analytics-chart analytics-chart-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={casesByStatusData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={68}
                    outerRadius={106}
                    paddingAngle={3}
                    cornerRadius={6}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {casesByStatusData.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={CASE_STATUS_COLORS[index % CASE_STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DashboardTooltip />} cursor={false} />
                  <Legend
                    verticalAlign="bottom"
                    content={(legendProps) => <DashboardLegend {...legendProps} />}
                  />
                  <text x="50%" y="47%" textAnchor="middle" className="chart-donut-caption">
                    Total cases
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" className="chart-donut-value">
                    {formatInteger(totalCasesFromStatus)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="table-meta">No case status data available.</p>
          )}
        </Card>

        <Card
          title="Monthly Case Trend"
          subtitle="Cases created over last 6 months"
          action={
            <span className="chart-card-badge">
              {peakTrendPoint ? `${peakTrendPoint.label}: ${formatInteger(peakTrendPoint.value)}` : 'Trend pending'}
            </span>
          }
          className="chart-card chart-card-monthly-trend reveal"
        >
          {monthlyTrendData.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthlyTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5b6bff" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#5b6bff" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 7" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} tick={CHART_AXIS_TICK} />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    width={34}
                    tick={CHART_AXIS_TICK}
                  />
                  <Tooltip content={<DashboardTooltip />} cursor={CHART_LINE_TOOLTIP_CURSOR} />
                  <Area
                    type="natural"
                    dataKey="value"
                    name="Cases"
                    stroke="#4f5ef6"
                    strokeWidth={3}
                    fill="url(#monthlyTrendGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#ffffff', stroke: '#4f5ef6', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="table-meta">No monthly trend data available.</p>
          )}
        </Card>

        <Card
          title="Members by Gender"
          subtitle="Distribution snapshot"
          action={<span className="chart-card-badge">{membersByGenderData.length} categories</span>}
          className="chart-card chart-card-members-gender reveal"
        >
          {membersByGenderData.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={membersByGenderData}
                  margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                  barCategoryGap={hasFewGenderBars ? '6%' : '20%'}
                >
                  <CartesianGrid strokeDasharray="3 7" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} tick={CHART_AXIS_TICK} />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    width={34}
                    tick={CHART_AXIS_TICK}
                  />
                  <Tooltip content={<DashboardTooltip />} cursor={CHART_BAR_TOOLTIP_CURSOR} />
                  <Bar
                    dataKey="value"
                    name="Members"
                    radius={[12, 12, 4, 4]}
                    barSize={hasFewGenderBars ? 50 : undefined}
                    maxBarSize={hasFewGenderBars ? 52 : 46}
                  >
                    {membersByGenderData.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="table-meta">No member gender data available.</p>
          )}
        </Card>
      </section>
    </div>
  )
}
