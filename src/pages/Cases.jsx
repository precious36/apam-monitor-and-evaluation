import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusPill from '../components/StatusPill'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const CASE_STATUS_OPTIONS = [
  'Under Investigation',
  'Critical',
  'Ongoing',
  'Arrest made',
  'Case on hearing stage',
  'No arrest made',
  'Sentenced',
  'Acquitted',
  'Closed',
]

const MALAWI_DISTRICTS = [
  'Balaka',
  'Blantyre',
  'Chikwawa',
  'Chiradzulu',
  'Chitipa',
  'Dedza',
  'Dowa',
  'Karonga',
  'Kasungu',
  'Likoma',
  'Lilongwe',
  'Machinga',
  'Mangochi',
  'Mchinji',
  'Mulanje',
  'Mwanza',
  'Mzimba',
  'Neno',
  'Nkhata Bay',
  'Nkhotakota',
  'Nsanje',
  'Ntcheu',
  'Ntchisi',
  'Phalombe',
  'Rumphi',
  'Salima',
  'Thyolo',
  'Zomba',
]

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

  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }

  return fallbackMessage
}

const normalizeToken = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const formatDateValue = (value) => {
  if (!value) {
    return 'Not provided'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTimeValue = (value) => {
  if (!value) {
    return 'Not provided'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toDisplayValue = (value) => {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : 'Not provided'
}

const splitDetailList = (value) => {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const createEmptyCaseForm = () => ({
  memberId: '',
  caseSerialNumber: '',
  caseDate: '',
  caseType: '',
  district: '',
  location: '',
  modus: '',
  support: '',
  suspectDetails: '',
  reporterName: '',
  policeOfficerName: '',
  caseStatus: 'Under Investigation',
  statusNotes: '',
})

const isClosedCaseStatus = (status) => {
  const token = normalizeToken(status)
  return token === 'closed' || token === 'sentenced' || token === 'acquitted'
}

const isOngoingCaseStatus = (status) => {
  const token = normalizeToken(status)
  return (
    token === 'ongoing' ||
    token === 'underinvestigation' ||
    token === 'caseonhearingstage' ||
    token === 'arrestmade'
  )
}

const isCriticalCaseStatus = (status) => normalizeToken(status) === 'critical'

const formatMemberCode = (memberId) => {
  if (!memberId) {
    return ''
  }

  return `BEN-${String(memberId).padStart(5, '0')}`
}

export default function Cases({ session }) {
  const notify = useNotify()
  const [cases, setCases] = useState([])
  const [members, setMembers] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [isCaseDetailVisible, setIsCaseDetailVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMembersLoading, setIsMembersLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [membersError, setMembersError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [statusForm, setStatusForm] = useState({
    caseStatus: 'Under Investigation',
    statusNotes: '',
  })
  const [newCaseForm, setNewCaseForm] = useState(() => createEmptyCaseForm())

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const fetchCases = async () => {
    const response = await fetch(`${API_BASE_URL}/api/cases`, {
      headers: authHeader,
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load cases.'))
    }

    return payload.data ?? []
  }

  const fetchMembers = async () => {
    const response = await fetch(`${API_BASE_URL}/api/members`, {
      headers: authHeader,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load members.'))
    }

    return payload.data ?? []
  }

  const loadMembers = async () => {
    setIsMembersLoading(true)
    setMembersError('')

    try {
      const membersPayload = await fetchMembers()
      setMembers(membersPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load members.'
      setMembers([])
      setMembersError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsMembersLoading(false)
    }
  }

  const loadCasesPage = async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const casesPayload = await fetchCases()
      setCases(casesPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cases.'
      setPageError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCasesPage()
    loadMembers()
  }, [session?.accessToken])

  useEffect(() => {
    if (cases.length === 0) {
      setSelectedCaseId(null)
      setIsCaseDetailVisible(false)
      return
    }

    if (!selectedCaseId) {
      return
    }

    const hasSelectedCase = cases.some((caseRecord) => caseRecord.caseId === selectedCaseId)
    if (!hasSelectedCase) {
      setSelectedCaseId(null)
      setIsCaseDetailVisible(false)
    }
  }, [cases, selectedCaseId])

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) {
      return null
    }

    return cases.find((caseRecord) => caseRecord.caseId === selectedCaseId) ?? null
  }, [cases, selectedCaseId])

  const typeOptions = useMemo(() => {
    return [...new Set(cases.map((caseRecord) => caseRecord.caseType).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b)),
    )
  }, [cases])

  const statusOptions = useMemo(() => {
    const dynamicStatuses = [...new Set(cases.map((caseRecord) => caseRecord.caseStatus).filter(Boolean))]
    const combined = [...new Set([...CASE_STATUS_OPTIONS, ...dynamicStatuses])]
    return combined.sort((a, b) => String(a).localeCompare(String(b)))
  }, [cases])

  const filteredCases = useMemo(() => {
    const searchToken = searchTerm.trim().toLowerCase()

    return cases.filter((caseRecord) => {
      if (typeFilter !== 'All' && caseRecord.caseType !== typeFilter) {
        return false
      }

      if (statusFilter !== 'All' && caseRecord.caseStatus !== statusFilter) {
        return false
      }

      if (!searchToken) {
        return true
      }

      const searchableText = [
        caseRecord.caseCode,
        caseRecord.caseSerialNumber,
        caseRecord.caseType,
        caseRecord.district,
        caseRecord.support,
        caseRecord.victimOrDeceased,
        caseRecord.suspectDetails,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(searchToken)
    })
  }, [cases, searchTerm, statusFilter, typeFilter])

  const metrics = useMemo(() => {
    const activeCases = cases.filter((caseRecord) => !isClosedCaseStatus(caseRecord.caseStatus)).length
    const criticalCases = cases.filter((caseRecord) => isCriticalCaseStatus(caseRecord.caseStatus)).length
    const ongoingCases = cases.filter((caseRecord) => isOngoingCaseStatus(caseRecord.caseStatus)).length
    const closedCases = cases.filter((caseRecord) => isClosedCaseStatus(caseRecord.caseStatus)).length

    return {
      total: cases.length,
      activeCases,
      criticalCases,
      ongoingCases,
      closedCases,
    }
  }, [cases])

  const rows = useMemo(() => {
    return filteredCases.map((caseRecord) => ({
      id: caseRecord.caseCode,
      caseId: caseRecord.caseId,
      caseCode: caseRecord.caseCode,
      member: caseRecord.memberName || caseRecord.victimOrDeceased || 'Not provided',
      type: caseRecord.caseType,
      district: caseRecord.district,
      date: formatDateValue(caseRecord.caseDate),
      status: caseRecord.caseStatus,
      officer: caseRecord.policeOfficerName || 'Not assigned',
      source: caseRecord,
    }))
  }, [filteredCases])

  const handleViewCase = (caseId) => {
    setSelectedCaseId(caseId)
    setIsCaseDetailVisible(true)
  }

  const closeCaseDetail = () => {
    setIsCaseDetailVisible(false)
  }

  const columns = useMemo(
    () => [
      { key: 'caseCode', label: 'Case ID' },
      { key: 'member', label: 'Victim/Member' },
      { key: 'type', label: 'Case' },
      { key: 'district', label: 'District' },
      { key: 'date', label: 'Date' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusPill value={row.status} />,
      },
      { key: 'officer', label: 'Police officer' },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <Button variant="outline" size="sm" onClick={() => handleViewCase(row.caseId)}>
            View case
          </Button>
        ),
      },
    ],
    [handleViewCase],
  )

  const caseStatusOptions = useMemo(() => {
    const selectedCaseStatus = selectedCase?.caseStatus
    if (!selectedCaseStatus) {
      return statusOptions
    }

    return statusOptions.includes(selectedCaseStatus)
      ? statusOptions
      : [...statusOptions, selectedCaseStatus].sort((a, b) => String(a).localeCompare(String(b)))
  }, [selectedCase?.caseStatus, statusOptions])

  const suspects = useMemo(() => splitDetailList(selectedCase?.suspectDetails), [selectedCase?.suspectDetails])
  const statusUpdates = useMemo(() => selectedCase?.statusUpdates ?? [], [selectedCase?.statusUpdates])

  const updateNewCaseField = (field) => (event) => {
    const { value } = event.target
    setNewCaseForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleVictimMemberChange = (event) => {
    const { value } = event.target

    setNewCaseForm((prev) => {
      if (!value) {
        return { ...prev, memberId: '' }
      }

      const selectedMember = members.find((member) => String(member.memberId) === value)
      if (!selectedMember) {
        return { ...prev, memberId: value }
      }

      return {
        ...prev,
        memberId: value,
        district: prev.district || selectedMember.district || '',
      }
    })
  }

  const handleStatusFieldChange = (field) => (event) => {
    const { value } = event.target
    setStatusForm((prev) => ({ ...prev, [field]: value }))
  }

  const openStatusModal = () => {
    if (!selectedCase) {
      return
    }

    setSaveError('')
    setStatusForm({
      caseStatus: selectedCase.caseStatus || 'Under Investigation',
      statusNotes: selectedCase.statusNotes || '',
    })
    setIsModalOpen(true)
  }

  const closeNewCaseModal = () => {
    if (isSaving) {
      return
    }

    setIsNewCaseOpen(false)
    setSaveError('')
    setNewCaseForm(createEmptyCaseForm())
  }

  const openNewCaseModal = () => {
    setSaveError('')
    setIsNewCaseOpen(true)
    loadMembers()
  }

  const handleCreateCase = async () => {
    const caseType = newCaseForm.caseType.trim()
    const district = newCaseForm.district.trim()
    const selectedVictimMember = members.find(
      (member) => String(member.memberId) === String(newCaseForm.memberId),
    )

    if (!selectedVictimMember) {
      const errorMessage = 'Victim member is required.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    if (!caseType || !district) {
      const errorMessage = 'Case type and district are required.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          memberId: newCaseForm.memberId ? Number(newCaseForm.memberId) : null,
          caseSerialNumber: newCaseForm.caseSerialNumber || null,
          caseDate: newCaseForm.caseDate || null,
          caseType,
          district,
          location: newCaseForm.location || null,
          modus: newCaseForm.modus || null,
          support: newCaseForm.support || null,
          victimOrDeceased: selectedVictimMember.fullName || null,
          suspectDetails: newCaseForm.suspectDetails || null,
          reporterName: newCaseForm.reporterName || null,
          policeOfficerName: newCaseForm.policeOfficerName || null,
          caseStatus: newCaseForm.caseStatus || null,
          statusNotes: newCaseForm.statusNotes || null,
        }),
      })

      const responseBody = await response.json().catch(() => null)
      if (!response.ok || !responseBody?.succeeded || !responseBody?.data) {
        throw new Error(getApiErrorMessage(responseBody, response.status, 'Failed to create case.'))
      }

      await loadCasesPage()
      setSelectedCaseId(responseBody.data.caseId)
      closeNewCaseModal()
      notify.success('Case created successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create case.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCaseStatus = async () => {
    if (!selectedCase?.caseId) {
      return
    }

    const caseStatus = statusForm.caseStatus.trim()
    if (!caseStatus) {
      const errorMessage = 'Status is required.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/cases/${selectedCase.caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          caseStatus,
          statusNotes: statusForm.statusNotes || null,
          updatedBy: session?.user?.userName || null,
        }),
      })

      const responseBody = await response.json().catch(() => null)
      if (!response.ok || !responseBody?.succeeded || !responseBody?.data) {
        throw new Error(getApiErrorMessage(responseBody, response.status, 'Failed to update case status.'))
      }

      await loadCasesPage()
      setSelectedCaseId(responseBody.data.caseId)
      setIsModalOpen(false)
      notify.success('Case status updated successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update case status.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Case management</p>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">
            Track incidents, investigations, and outcomes for cases involving persons with albinism.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={loadCasesPage} disabled={isLoading || isSaving}>
            Refresh list
          </Button>
          <Button onClick={openNewCaseModal}>New case</Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total cases" subtitle="All records">
          <div className="metric-value">{metrics.total}</div>
          <p className="metric-meta">Across all districts</p>
        </Card>
        <Card className="metric-card reveal" title="Active cases" subtitle="Open and ongoing">
          <div className="metric-value">{metrics.activeCases}</div>
          <p className="metric-meta">Awaiting closure</p>
        </Card>
        <Card className="metric-card reveal" title="Critical" subtitle="Immediate response">
          <div className="metric-value">{metrics.criticalCases}</div>
          <p className="metric-meta">High-priority incidents</p>
        </Card>
        <Card className="metric-card reveal" title="Closed outcomes" subtitle="Resolved">
          <div className="metric-value">{metrics.closedCases}</div>
          <p className="metric-meta">Completed case handling</p>
        </Card>
      </section>

      <div className="cases-layout cases-layout-single">
        <Card className="reveal">
          {pageError ? (
            <p className="alert" role="alert">
              {pageError}
            </p>
          ) : null}

          <div className="filters-row">
            <input
              type="search"
              placeholder="Search by case ID, serial #, victim, suspect..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="All">All case types</option>
              {typeOptions.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All statuses</option>
              {statusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="table-meta">Loading cases...</p>
          ) : rows.length === 0 ? (
            <p className="table-meta">No cases found for the selected filters.</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </Card>

      </div>

      <Modal
        open={isCaseDetailVisible && Boolean(selectedCase)}
        title="Case detail"
        subtitle="Incident and response summary"
        onClose={closeCaseDetail}
        footer={
          selectedCase ? (
            <div className="modal-actions">
              <Button variant="ghost" onClick={closeCaseDetail}>
                Close
              </Button>
              <Button
                onClick={() => {
                  closeCaseDetail()
                  openStatusModal()
                }}
              >
                Update case status
              </Button>
            </div>
          ) : null
        }
      >
        {selectedCase ? (
          <div className="case-detail">
            <div>
              <p className="info-label">Incident information</p>
              <p className="info-value">
                {toDisplayValue(selectedCase.caseType)} reported in {toDisplayValue(selectedCase.district)}.
              </p>
              <p className="info-meta">
                {toDisplayValue(selectedCase.caseCode)} - Date {formatDateValue(selectedCase.caseDate)} - Police
                officer {toDisplayValue(selectedCase.policeOfficerName)}
              </p>
            </div>

            <div className="info-grid">
              <div>
                <p className="info-label">Case serial #</p>
                <p className="info-value">{toDisplayValue(selectedCase.caseSerialNumber)}</p>
              </div>
              <div>
                <p className="info-label">District</p>
                <p className="info-value">{toDisplayValue(selectedCase.district)}</p>
              </div>
              <div>
                <p className="info-label">Location</p>
                <p className="info-value">{toDisplayValue(selectedCase.location)}</p>
              </div>
              <div>
                <p className="info-label">Case status</p>
                <StatusPill value={selectedCase.caseStatus} />
              </div>
              <div>
                <p className="info-label">Reporter</p>
                <p className="info-value">{toDisplayValue(selectedCase.reporterName)}</p>
              </div>
              <div>
                <p className="info-label">Police officer</p>
                <p className="info-value">{toDisplayValue(selectedCase.policeOfficerName)}</p>
              </div>
            </div>

            <div>
              <p className="info-label">Victim / deceased</p>
              <ul className="detail-list">
                <li>Name/details: {toDisplayValue(selectedCase.memberName || selectedCase.victimOrDeceased)}</li>
                <li>Member code: {toDisplayValue(selectedCase.memberCode || formatMemberCode(selectedCase.memberId))}</li>
              </ul>
            </div>

            <div>
              <p className="info-label">Modus</p>
              <p className="info-value">{toDisplayValue(selectedCase.modus)}</p>
            </div>

            <div>
              <p className="info-label">Support</p>
              <p className="info-value">{toDisplayValue(selectedCase.support)}</p>
            </div>

            <div>
              <p className="info-label">Suspects</p>
              {suspects.length > 0 ? (
                <ul className="detail-list">
                  {suspects.map((suspect) => (
                    <li key={suspect}>{suspect}</li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">Not provided</p>
              )}
            </div>

            <div>
              <p className="info-label">Timeline and status updates</p>
              {statusUpdates.length > 0 ? (
                <ul className="timeline">
                  {statusUpdates.map((update) => (
                    <li key={update.caseStatusUpdateId}>
                      <span>{formatDateTimeValue(update.updatedAtUtc)}</span>
                      <p>
                        <strong>{update.caseStatus}</strong>
                        {update.updatedBy ? ` - by ${update.updatedBy}` : ''}
                      </p>
                      {update.statusNotes ? <p>{update.statusNotes}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">No status updates yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isModalOpen}
        title="Update case status"
        subtitle="Record the latest status update"
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCaseStatus} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save update'}
            </Button>
          </div>
        }
      >
        {saveError ? (
          <p className="alert" role="alert">
            {saveError}
          </p>
        ) : null}
        <div className="form-grid">
          <label className="form-field">
            <span>New status</span>
            <select value={statusForm.caseStatus} onChange={handleStatusFieldChange('caseStatus')}>
              {caseStatusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field form-field-full">
            <span>Status notes</span>
            <textarea
              rows="4"
              value={statusForm.statusNotes}
              onChange={handleStatusFieldChange('statusNotes')}
              placeholder="Describe the latest update"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={isNewCaseOpen}
        title="Create new case"
        subtitle="Capture case details from the national template"
        onClose={closeNewCaseModal}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={closeNewCaseModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateCase} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create case'}
            </Button>
          </div>
        }
      >
        {saveError ? (
          <p className="alert" role="alert">
            {saveError}
          </p>
        ) : null}
        {membersError ? (
          <p className="alert" role="alert">
            {membersError}
          </p>
        ) : null}
        <div className="form-grid">
          <label className="form-field">
            <span>Victim / deceased</span>
            <select
              value={newCaseForm.memberId}
              onChange={handleVictimMemberChange}
              disabled={isMembersLoading}
              required
            >
              <option value="">Select victim member</option>
              {isMembersLoading ? <option value="" disabled>Loading members...</option> : null}
              {members.map((member) => (
                <option key={member.memberId} value={member.memberId}>
                  {member.fullName} ({member.memberCode || formatMemberCode(member.memberId)})
                </option>
              ))}
            </select>
            {membersError ? (
              <Button variant="outline" size="sm" onClick={loadMembers} disabled={isMembersLoading}>
                Retry loading members
              </Button>
            ) : null}
          </label>

          <label className="form-field">
            <span>Date</span>
            <input
              type="date"
              value={newCaseForm.caseDate}
              onChange={updateNewCaseField('caseDate')}
            />
          </label>

          <label className="form-field">
            <span>Case # / serial #</span>
            <input
              type="text"
              value={newCaseForm.caseSerialNumber}
              onChange={updateNewCaseField('caseSerialNumber')}
              placeholder="Case serial number"
            />
          </label>

          <label className="form-field">
            <span>Case type</span>
            <input
              type="text"
              value={newCaseForm.caseType}
              onChange={updateNewCaseField('caseType')}
              placeholder="e.g. Tampering the graveyard"
              required
            />
          </label>

          <label className="form-field">
            <span>District</span>
            <input
              list="case-districts"
              value={newCaseForm.district}
              onChange={updateNewCaseField('district')}
              placeholder="Select or type district"
              required
            />
            <datalist id="case-districts">
              {MALAWI_DISTRICTS.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
          </label>

          <label className="form-field">
            <span>Location</span>
            <input
              type="text"
              value={newCaseForm.location}
              onChange={updateNewCaseField('location')}
              placeholder="Village, TA, trading center, etc."
            />
          </label>

          <label className="form-field">
            <span>Reporter name</span>
            <input
              type="text"
              value={newCaseForm.reporterName}
              onChange={updateNewCaseField('reporterName')}
              placeholder="Person who reported the case"
            />
          </label>

          <label className="form-field">
            <span>Police officer</span>
            <input
              type="text"
              value={newCaseForm.policeOfficerName}
              onChange={updateNewCaseField('policeOfficerName')}
              placeholder="Officer who handled the case"
            />
          </label>

          <label className="form-field">
            <span>Case status</span>
            <select value={newCaseForm.caseStatus} onChange={updateNewCaseField('caseStatus')}>
              {caseStatusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>Modus</span>
            <textarea
              rows="4"
              value={newCaseForm.modus}
              onChange={updateNewCaseField('modus')}
              placeholder="Describe what happened"
            />
          </label>

          <label className="form-field form-field-full">
            <span>Support</span>
            <textarea
              rows="3"
              value={newCaseForm.support}
              onChange={updateNewCaseField('support')}
              placeholder="Support needed/provided (medical, legal, psychosocial, etc.)"
            />
          </label>

          <label className="form-field form-field-full">
            <span>Suspect details</span>
            <textarea
              rows="3"
              value={newCaseForm.suspectDetails}
              onChange={updateNewCaseField('suspectDetails')}
              placeholder="Name(s) or suspect details"
            />
          </label>

          <label className="form-field form-field-full">
            <span>Initial status notes</span>
            <textarea
              rows="3"
              value={newCaseForm.statusNotes}
              onChange={updateNewCaseField('statusNotes')}
              placeholder="Any notes for this case status"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}

