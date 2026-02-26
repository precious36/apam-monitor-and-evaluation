import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import HorizontalBarChart from '../components/HorizontalBarChart'
import ColumnChart from '../components/ColumnChart'
import DataTable from '../components/DataTable'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const EMPTY_LIST = []

const INITIAL_FILTERS = {
  startDate: '',
  endDate: '',
  district: 'All',
  gender: 'All',
}

const EMPTY_REPORT = {
  generatedAtUtc: null,
  appliedFilters: {
    startDate: null,
    endDate: null,
    district: null,
    gender: null,
  },
  availableDistricts: [],
  availableGenders: [],
  summary: {
    totalMembers: 0,
    marriedMembers: 0,
    membersRunningBusinesses: 0,
    employedMembers: 0,
    unemployedMembers: 0,
    membersWithSkills: 0,
    membersWithoutSkills: 0,
    distinctSkillsRecorded: 0,
  },
  maritalStatusBreakdown: [],
  businessOwnershipBreakdown: [],
  employmentStatusBreakdown: [],
  ageGroupBreakdown: [],
  membersByDistrict: [],
  skillsByCategory: [],
  skillLevels: [],
  skillCertificationBreakdown: [],
  topSkills: [],
}

function getApiErrorMessage(payload, status, fallbackMessage) {
  if (payload?.errors?.length) {
    return payload.errors[0]
  }

  if (payload?.message) {
    return payload.message
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403) {
    return 'You do not have permission to view this feature.'
  }

  return fallbackMessage
}

function formatInteger(value) {
  return Number(value ?? 0).toLocaleString()
}

function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleString()
}

function buildMemberReportsQuery(filters) {
  const params = new URLSearchParams()

  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }

  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }

  if (filters.district && filters.district !== 'All') {
    params.set('district', filters.district)
  }

  if (filters.gender && filters.gender !== 'All') {
    params.set('gender', filters.gender)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function toCsvValue(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

function downloadBlob(filename, content, type) {
  if (typeof window === 'undefined') {
    return
  }

  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export default function Reports({ session }) {
  const notify = useNotify()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [report, setReport] = useState(EMPTY_REPORT)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const loadMemberReports = useCallback(
    async (nextFilters = INITIAL_FILTERS) => {
      setIsLoading(true)
      setPageError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/members${buildMemberReportsQuery(nextFilters)}`, {
          headers: authHeader,
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.succeeded || !payload?.data) {
          throw new Error(getApiErrorMessage(payload, response.status, 'Failed to generate member reports.'))
        }

        setReport({ ...EMPTY_REPORT, ...payload.data })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load reports.'
        setReport(EMPTY_REPORT)
        setPageError(message)
        notify.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [authHeader, notify]
  )

  useEffect(() => {
    loadMemberReports(INITIAL_FILTERS)
  }, [loadMemberReports])

  const summary = report.summary ?? EMPTY_REPORT.summary
  const maritalStatusData = report.maritalStatusBreakdown ?? EMPTY_LIST
  const businessOwnershipData = report.businessOwnershipBreakdown ?? EMPTY_LIST
  const employmentStatusData = report.employmentStatusBreakdown ?? EMPTY_LIST
  const ageGroupData = report.ageGroupBreakdown ?? EMPTY_LIST
  const membersByDistrictData = report.membersByDistrict ?? EMPTY_LIST
  const skillsByCategoryData = report.skillsByCategory ?? EMPTY_LIST
  const skillLevelsData = report.skillLevels ?? EMPTY_LIST
  const skillCertificationData = report.skillCertificationBreakdown ?? EMPTY_LIST
  const topSkillsData = report.topSkills ?? EMPTY_LIST

  const districtOptions = useMemo(() => {
    const labels = new Set(['All'])

    ;(report.availableDistricts ?? EMPTY_LIST).forEach((district) => {
      if (district) {
        labels.add(district)
      }
    })

    if (filters.district && filters.district !== 'All') {
      labels.add(filters.district)
    }

    return [...labels]
  }, [filters.district, report.availableDistricts])

  const genderOptions = useMemo(() => {
    const labels = new Set(['All'])

    ;(report.availableGenders ?? EMPTY_LIST).forEach((gender) => {
      if (gender) {
        labels.add(gender)
      }
    })

    if (filters.gender && filters.gender !== 'All') {
      labels.add(filters.gender)
    }

    return [...labels]
  }, [filters.gender, report.availableGenders])

  const generatedAtLabel = formatDateTime(report.generatedAtUtc)

  const topSkillsRows = useMemo(() => {
    const totalMembers = Number(summary.totalMembers ?? 0)

    return topSkillsData.map((row, index) => ({
      id: `${row.skillCategory}-${row.skillName}-${index}`,
      skillName: row.skillName,
      skillCategory: row.skillCategory,
      members: formatInteger(row.members),
      certifiedEntries: formatInteger(row.certifiedEntries),
      memberCoverage:
        totalMembers > 0 ? `${Math.round((Number(row.members ?? 0) / totalMembers) * 100)}%` : '0%',
    }))
  }, [summary.totalMembers, topSkillsData])

  const topSkillsColumns = useMemo(
    () => [
      { key: 'skillName', label: 'Skill' },
      { key: 'skillCategory', label: 'Category' },
      { key: 'members', label: 'Members' },
      { key: 'certifiedEntries', label: 'Certified entries' },
      { key: 'memberCoverage', label: 'Coverage' },
    ],
    []
  )

  const summaryCards = [
    { label: 'Total members', value: summary.totalMembers, note: 'Filtered member records' },
    { label: 'Married', value: summary.marriedMembers, note: 'Members with marital status = Married' },
    { label: 'Business owners', value: summary.membersRunningBusinesses, note: 'Members running a business' },
    { label: 'Employed', value: summary.employedMembers, note: 'Includes self-employed members' },
    { label: 'Unemployed', value: summary.unemployedMembers, note: 'Members marked unemployed' },
    { label: 'Members with skills', value: summary.membersWithSkills, note: 'At least one recorded skill' },
    { label: 'Members without skills', value: summary.membersWithoutSkills, note: 'No skills recorded yet' },
    { label: 'Distinct skills', value: summary.distinctSkillsRecorded, note: 'Unique skills in records' },
  ]

  const handleFilterChange = (field) => (event) => {
    const { value } = event.target
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    loadMemberReports(filters)
  }

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
    loadMemberReports(INITIAL_FILTERS)
  }

  const handleExportJson = () => {
    downloadBlob(
      `member-reports-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(report, null, 2),
      'application/json'
    )
    notify.success('Member report JSON exported.')
  }

  const handleExportTopSkillsCsv = () => {
    const header = ['Skill', 'Category', 'Members', 'Certified Entries']
    const rows = topSkillsData.map((row) => [
      row.skillName,
      row.skillCategory,
      row.members,
      row.certifiedEntries,
    ])
    const csv = [header, ...rows].map((line) => line.map(toCsvValue).join(',')).join('\n')

    downloadBlob(
      `member-top-skills-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8'
    )
    notify.success('Top skills CSV exported.')
  }

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Reports and M&E</p>
          <h1 className="page-title">Member Reports</h1>
          <p className="page-subtitle">
            Generate reports for marital status, business ownership, employment, age groups, districts, and skills.
          </p>
          <p className="table-meta">Generated: {generatedAtLabel}</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={() => loadMemberReports(filters)} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Refresh report'}
          </Button>
          <Button variant="outline" onClick={handleExportTopSkillsCsv} disabled={isLoading || topSkillsData.length === 0}>
            Export top skills CSV
          </Button>
          <Button onClick={handleExportJson} disabled={isLoading}>
            Export report JSON
          </Button>
        </div>
      </div>

      {pageError ? (
        <p className="alert" role="alert">
          {pageError}
        </p>
      ) : null}

      <div className="reports-layout">
        <aside className="filters-panel reveal">
          <h3>Member report filters</h3>
          <p className="table-meta">
            Filters apply to all report sections and skill reports.
          </p>

          <label className="form-field">
            <span>Member record date from</span>
            <input type="date" value={filters.startDate} onChange={handleFilterChange('startDate')} />
          </label>

          <label className="form-field">
            <span>Member record date to</span>
            <input type="date" value={filters.endDate} onChange={handleFilterChange('endDate')} />
          </label>

          <label className="form-field">
            <span>District</span>
            <select value={filters.district} onChange={handleFilterChange('district')}>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Gender</span>
            <select value={filters.gender} onChange={handleFilterChange('gender')}>
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender === 'All' ? 'All genders' : gender}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-actions">
            <Button onClick={handleApplyFilters} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Apply filters'}
            </Button>
            <Button variant="ghost" onClick={handleResetFilters} disabled={isLoading}>
              Reset
            </Button>
          </div>

          <div className="report-filter-summary">
            <p className="report-filter-summary-label">Active scope</p>
            <p className="report-filter-summary-value">
              {report.appliedFilters?.district || 'All districts'}
            </p>
            <p className="report-filter-summary-value">
              {report.appliedFilters?.gender || 'All genders'}
            </p>
          </div>
        </aside>

        <div className="reports-main">
          <section className="reports-kpi-grid">
            {summaryCards.map((card) => (
              <Card key={card.label} className="report-kpi-card reveal">
                <div className="report-kpi-card-body">
                  <p className="report-kpi-label">{card.label}</p>
                  <p className="report-kpi-value">{formatInteger(card.value)}</p>
                  <p className="report-kpi-note">{card.note}</p>
                </div>
              </Card>
            ))}
          </section>

          <section className="reports-chart-grid">
            <Card title="Marital status report" subtitle="How many members are married, single, widowed, etc." className="reveal">
              {maritalStatusData.length > 0 ? (
                <HorizontalBarChart data={maritalStatusData} />
              ) : (
                <p className="table-meta">No marital status report data available.</p>
              )}
            </Card>

            <Card title="Business ownership report" subtitle="How many members run businesses" className="reveal">
              {businessOwnershipData.length > 0 ? (
                <HorizontalBarChart data={businessOwnershipData} />
              ) : (
                <p className="table-meta">No business ownership report data available.</p>
              )}
            </Card>

            <Card title="Employment report" subtitle="Employed, self-employed, unemployed and other statuses" className="reveal">
              {employmentStatusData.length > 0 ? (
                <HorizontalBarChart data={employmentStatusData} />
              ) : (
                <p className="table-meta">No employment report data available.</p>
              )}
            </Card>

            <Card title="Age group report" subtitle="Member counts by age bands" className="reveal">
              {ageGroupData.length > 0 ? (
                <ColumnChart data={ageGroupData} />
              ) : (
                <p className="table-meta">No age group report data available.</p>
              )}
            </Card>

            <Card title="District report" subtitle="Member distribution by district" className="reveal">
              {membersByDistrictData.length > 0 ? (
                <HorizontalBarChart data={membersByDistrictData} />
              ) : (
                <p className="table-meta">No district report data available.</p>
              )}
            </Card>
          </section>

          <section className="reports-chart-grid reports-chart-grid-skills">
            <Card title="Skills by category" subtitle="Members with recorded skills by category" className="reveal">
              {skillsByCategoryData.length > 0 ? (
                <HorizontalBarChart data={skillsByCategoryData} />
              ) : (
                <p className="table-meta">No skills category report data available.</p>
              )}
            </Card>

            <Card title="Skill levels" subtitle="Recorded skill levels across members" className="reveal">
              {skillLevelsData.length > 0 ? (
                <HorizontalBarChart data={skillLevelsData} />
              ) : (
                <p className="table-meta">No skill level report data available.</p>
              )}
            </Card>

            <Card title="Skill certification" subtitle="Certified vs non-certified skill entries" className="reveal">
              {skillCertificationData.length > 0 ? (
                <HorizontalBarChart data={skillCertificationData} />
              ) : (
                <p className="table-meta">No skill certification report data available.</p>
              )}
            </Card>
          </section>

          <Card title="Top skills report" subtitle="Most frequently recorded skills among members" className="reveal">
            {topSkillsRows.length > 0 ? (
              <DataTable columns={topSkillsColumns} rows={topSkillsRows} />
            ) : (
              <p className="table-meta">No skill records found for the selected filters.</p>
            )}
          </Card>

          <Card title="Report notes" subtitle="What this report is counting" className="reveal">
            <ul className="report-notes-list">
              <li>`Employed` includes `Self-employed` in the summary total.</li>
              <li>Business ownership is based on the member business profile field `currentlyRunsBusiness`.</li>
              <li>Age groups are calculated from `dateOfBirth`; missing dates are grouped as unknown.</li>
              <li>Skill reports use recorded member skills and include category, level, and certification breakdowns.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
