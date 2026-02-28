import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusPill from '../components/StatusPill'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const DEFAULT_PROGRAM_STATUSES = ['Planned', 'Ongoing', 'Completed']

const createEmptyIndicator = () => ({
  indicator: '',
  target: '',
  outputOrOutcome: '',
})

const createEmptyProgramForm = () => ({
  organizationName: '',
  projectName: '',
  startDate: '',
  endDate: '',
  projectGoal: '',
  assignMembers: false,
  memberIds: [],
  objectives: [''],
  activities: [''],
  indicators: [createEmptyIndicator()],
})

const normalizeToken = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const toDisplayValue = (value) => {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : 'Not provided'
}

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

const formatDateForInput = (value) => {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().split('T')[0]
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

  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }

  return fallbackMessage
}

const dedupeTextValues = (values) => {
  const seen = new Set()
  const deduped = []

  values.forEach((value) => {
    const normalized = String(value ?? '').trim()
    if (!normalized) {
      return
    }

    const token = normalizeToken(normalized)
    if (!token || seen.has(token)) {
      return
    }

    seen.add(token)
    deduped.push(normalized)
  })

  return deduped
}

const mapProgramToForm = (program) => {
  const objectives = dedupeTextValues((program.objectives ?? []).map((entry) => entry.objective))
  const activities = dedupeTextValues((program.activities ?? []).map((entry) => entry.activity))
  const indicators = (program.indicators ?? [])
    .map((entry) => ({
      indicator: entry.indicator ?? '',
      target: entry.target ?? '',
      outputOrOutcome: entry.outputOrOutcome ?? '',
    }))
    .filter((entry) => entry.indicator || entry.target || entry.outputOrOutcome)

  return {
    organizationName: program.organizationName ?? '',
    projectName: program.projectName ?? '',
    startDate: formatDateForInput(program.startDate),
    endDate: formatDateForInput(program.endDate),
    projectGoal: program.projectGoal ?? '',
    assignMembers: Boolean(program.hasMemberAssignments) || (program.members ?? []).length > 0,
    memberIds: (program.members ?? [])
      .map((entry) => Number(entry.memberId))
      .filter((memberId) => Number.isInteger(memberId) && memberId > 0),
    objectives: objectives.length > 0 ? objectives : [''],
    activities: activities.length > 0 ? activities : [''],
    indicators: indicators.length > 0 ? indicators : [createEmptyIndicator()],
  }
}

export default function Programs({ session }) {
  const notify = useNotify()
  const [programs, setPrograms] = useState([])
  const [memberOptions, setMemberOptions] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState(null)
  const [isProgramDetailVisible, setIsProgramDetailVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProgramId, setEditingProgramId] = useState(null)
  const [formValues, setFormValues] = useState(() => createEmptyProgramForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isMemberOptionsLoading, setIsMemberOptionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [organizationFilter, setOrganizationFilter] = useState('All')
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false)
  const memberDropdownRef = useRef(null)

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const fetchPrograms = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/programs`, {
      headers: authHeader,
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load programs.'))
    }

    return payload.data ?? []
  }, [authHeader])

  const fetchMemberOptions = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/programs/member-options`, {
      headers: authHeader,
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load member options.'))
    }

    return payload.data ?? []
  }, [authHeader])

  const loadPrograms = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const programsPayload = await fetchPrograms()
      setPrograms(programsPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load programs.'
      setPrograms([])
      setPageError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fetchPrograms, notify])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  const loadMemberOptions = useCallback(async () => {
    setIsMemberOptionsLoading(true)

    try {
      const memberOptionsPayload = await fetchMemberOptions()
      setMemberOptions(memberOptionsPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load members for assignment.'
      setMemberOptions([])
      notify.error(errorMessage)
    } finally {
      setIsMemberOptionsLoading(false)
    }
  }, [fetchMemberOptions, notify])

  useEffect(() => {
    loadMemberOptions()
  }, [loadMemberOptions])

  useEffect(() => {
    if (programs.length === 0) {
      setSelectedProgramId(null)
      setIsProgramDetailVisible(false)
      return
    }

    if (!selectedProgramId) {
      return
    }

    const hasSelectedProgram = programs.some((program) => program.programId === selectedProgramId)
    if (!hasSelectedProgram) {
      setSelectedProgramId(null)
      setIsProgramDetailVisible(false)
    }
  }, [programs, selectedProgramId])

  const selectedProgram = useMemo(() => {
    if (!selectedProgramId) {
      return null
    }

    return programs.find((program) => program.programId === selectedProgramId) ?? null
  }, [programs, selectedProgramId])

  const statusOptions = useMemo(() => {
    const dynamicStatuses = [...new Set(programs.map((program) => program.programStatus).filter(Boolean))]
    const combined = [...new Set([...DEFAULT_PROGRAM_STATUSES, ...dynamicStatuses])]
    return combined.sort((valueA, valueB) => String(valueA).localeCompare(String(valueB)))
  }, [programs])

  const organizationOptions = useMemo(() => {
    return [...new Set(programs.map((program) => program.organizationName).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b)),
    )
  }, [programs])

  const filteredPrograms = useMemo(() => {
    const searchToken = searchTerm.trim().toLowerCase()

    return programs.filter((program) => {
      if (statusFilter !== 'All' && program.programStatus !== statusFilter) {
        return false
      }

      if (organizationFilter !== 'All' && program.organizationName !== organizationFilter) {
        return false
      }

      if (!searchToken) {
        return true
      }

      const searchableText = [
        program.programCode,
        program.projectName,
        program.organizationName,
        program.projectGoal,
        ...(program.objectives ?? []).map((entry) => entry.objective),
        ...(program.activities ?? []).map((entry) => entry.activity),
        ...(program.indicators ?? []).flatMap((entry) => [entry.indicator, entry.target, entry.outputOrOutcome]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(searchToken)
    })
  }, [organizationFilter, programs, searchTerm, statusFilter])

  const metrics = useMemo(() => {
    const values = {
      total: programs.length,
      planned: 0,
      ongoing: 0,
      completed: 0,
    }

    programs.forEach((program) => {
      const token = normalizeToken(program.programStatus)
      if (token === 'planned') {
        values.planned += 1
        return
      }

      if (token === 'completed') {
        values.completed += 1
        return
      }

      values.ongoing += 1
    })

    return values
  }, [programs])

  const rows = useMemo(() => {
    return filteredPrograms.map((program) => ({
      id: program.programCode,
      programId: program.programId,
      programCode: program.programCode,
      projectName: program.projectName,
      organizationName: program.organizationName,
      startDate: formatDateValue(program.startDate),
      endDate: formatDateValue(program.endDate),
      status: program.programStatus,
      source: program,
    }))
  }, [filteredPrograms])

  const handleViewProgram = (programId) => {
    setSelectedProgramId(programId)
    setIsProgramDetailVisible(true)
  }

  const handleCloseProgramDetail = () => {
    setIsProgramDetailVisible(false)
  }

  const columns = useMemo(
    () => [
      { key: 'programCode', label: 'Program ID' },
      { key: 'projectName', label: 'Project name' },
      { key: 'organizationName', label: 'Organization' },
      { key: 'startDate', label: 'Start date' },
      { key: 'endDate', label: 'End date' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusPill value={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <Button variant="outline" size="sm" onClick={() => handleViewProgram(row.programId)}>
            View program
          </Button>
        ),
      },
    ],
    [],
  )

  const closeModal = () => {
    if (isSaving) {
      return
    }

    setIsModalOpen(false)
    setSaveError('')
    setEditingProgramId(null)
    setFormValues(createEmptyProgramForm())
    setIsMemberDropdownOpen(false)
  }

  const openCreateModal = () => {
    setSaveError('')
    setEditingProgramId(null)
    setFormValues(createEmptyProgramForm())
    setIsMemberDropdownOpen(false)
    setIsModalOpen(true)
    if (memberOptions.length === 0) {
      loadMemberOptions()
    }
  }

  const openEditModal = (program) => {
    if (!program) {
      return
    }

    setSaveError('')
    setEditingProgramId(program.programId)
    setFormValues(mapProgramToForm(program))
    setIsMemberDropdownOpen(false)
    setIsModalOpen(true)
    if (memberOptions.length === 0) {
      loadMemberOptions()
    }
  }

  const updateField = (field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const updateAssignMembers = (event) => {
    const shouldAssignMembers = event.target.value === 'Yes'
    setFormValues((prev) => ({
      ...prev,
      assignMembers: shouldAssignMembers,
      memberIds: shouldAssignMembers ? prev.memberIds : [],
    }))
    if (!shouldAssignMembers) {
      setIsMemberDropdownOpen(false)
    }
  }

  const toggleAssignedMember = (memberId) => () => {
    const numericMemberId = Number(memberId)
    if (!Number.isInteger(numericMemberId) || numericMemberId <= 0) {
      return
    }

    setFormValues((prev) => {
      const hasSelected = prev.memberIds.includes(numericMemberId)
      const nextMemberIds = hasSelected
        ? prev.memberIds.filter((value) => value !== numericMemberId)
        : [...prev.memberIds, numericMemberId]

      return {
        ...prev,
        memberIds: nextMemberIds.sort((valueA, valueB) => valueA - valueB),
      }
    })
  }

  const selectedMembersSummary = useMemo(() => {
    if (formValues.memberIds.length === 0) {
      return 'Select members'
    }

    const selectedNames = memberOptions
      .filter((member) => formValues.memberIds.includes(Number(member.memberId)))
      .map((member) => member.fullName)

    if (selectedNames.length === 0) {
      return `${formValues.memberIds.length} selected`
    }

    if (selectedNames.length <= 2) {
      return selectedNames.join(', ')
    }

    return `${selectedNames.length} members selected`
  }, [formValues.memberIds, memberOptions])

  useEffect(() => {
    if (!isMemberDropdownOpen) {
      return
    }

    const handleDocumentMouseDown = (event) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
        setIsMemberDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [isMemberDropdownOpen])

  const updateListField = (field, index) => (event) => {
    const { value } = event.target
    setFormValues((prev) => {
      const nextValues = [...prev[field]]
      nextValues[index] = value
      return { ...prev, [field]: nextValues }
    })
  }

  const addListField = (field) => {
    setFormValues((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  const removeListField = (field, index) => {
    setFormValues((prev) => {
      if (prev[field].length <= 1) {
        return prev
      }

      return { ...prev, [field]: prev[field].filter((_, valueIndex) => valueIndex !== index) }
    })
  }

  const updateIndicatorField = (index, field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => ({
      ...prev,
      indicators: prev.indicators.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const addIndicator = () => {
    setFormValues((prev) => ({
      ...prev,
      indicators: [...prev.indicators, createEmptyIndicator()],
    }))
  }

  const removeIndicator = (index) => {
    setFormValues((prev) => {
      if (prev.indicators.length <= 1) {
        return prev
      }

      return {
        ...prev,
        indicators: prev.indicators.filter((_, entryIndex) => entryIndex !== index),
      }
    })
  }

  const getProgramPayload = () => {
    const organizationName = formValues.organizationName.trim()
    const projectName = formValues.projectName.trim()
    const startDate = formValues.startDate
    const endDate = formValues.endDate

    if (!organizationName || !projectName || !startDate || !endDate) {
      throw new Error('Organization name, project name, start date, and end date are required.')
    }

    const startDateValue = new Date(`${startDate}T00:00:00`)
    const endDateValue = new Date(`${endDate}T00:00:00`)
    if (Number.isNaN(startDateValue.getTime()) || Number.isNaN(endDateValue.getTime())) {
      throw new Error('Start date and end date are invalid.')
    }

    if (endDateValue < startDateValue) {
      throw new Error('End date cannot be before start date.')
    }

    const objectives = dedupeTextValues(formValues.objectives)
    if (objectives.length === 0) {
      throw new Error('Add at least one project objective.')
    }

    const activities = dedupeTextValues(formValues.activities)
    if (activities.length === 0) {
      throw new Error('Add at least one project activity.')
    }

    const normalizedIndicators = formValues.indicators
      .map((entry) => ({
        indicator: entry.indicator.trim(),
        target: entry.target.trim(),
        outputOrOutcome: entry.outputOrOutcome.trim(),
      }))
      .filter((entry) => entry.indicator || entry.target || entry.outputOrOutcome)

    if (normalizedIndicators.length === 0) {
      throw new Error('Add at least one indicator with target and output or outcome.')
    }

    if (
      normalizedIndicators.some(
        (entry) => !entry.indicator || !entry.target || !entry.outputOrOutcome,
      )
    ) {
      throw new Error('Each indicator must include indicator, target, and output or outcome.')
    }

    const indicators = []
    const indicatorTokens = new Set()
    normalizedIndicators.forEach((entry) => {
      const token = `${normalizeToken(entry.indicator)}::${normalizeToken(entry.target)}::${normalizeToken(
        entry.outputOrOutcome,
      )}`
      if (!token || indicatorTokens.has(token)) {
        return
      }

      indicatorTokens.add(token)
      indicators.push(entry)
    })

    if (indicators.length === 0) {
      throw new Error('Add at least one unique indicator.')
    }

    if (formValues.assignMembers && formValues.memberIds.length === 0) {
      throw new Error('Select at least one member or choose not to assign members.')
    }

    return {
      organizationName,
      projectName,
      startDate,
      endDate,
      projectGoal: formValues.projectGoal.trim() || null,
      assignMembers: formValues.assignMembers,
      memberIds: formValues.assignMembers ? formValues.memberIds : [],
      objectives,
      activities,
      indicators,
    }
  }

  const handleSaveProgram = async () => {
    setSaveError('')

    let payload
    try {
      payload = getProgramPayload()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please complete all required fields.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    setIsSaving(true)

    try {
      const isEditing = Boolean(editingProgramId)
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/api/programs/${editingProgramId}` : `${API_BASE_URL}/api/programs`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify(payload),
        },
      )

      const responseBody = await response.json().catch(() => null)
      if (!response.ok || !responseBody?.succeeded || !responseBody?.data) {
        throw new Error(
          getApiErrorMessage(responseBody, response.status, isEditing ? 'Failed to update program.' : 'Failed to create program.'),
        )
      }

      await loadPrograms()
      setSelectedProgramId(responseBody.data.programId)
      setIsProgramDetailVisible(false)
      closeModal()
      notify.success(isEditing ? 'Program updated successfully.' : 'Program created successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save program.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProgram = async () => {
    if (!selectedProgram?.programId) {
      return
    }

    const shouldDelete = window.confirm(
      `Delete "${selectedProgram.projectName}"? This action cannot be undone.`,
    )
    if (!shouldDelete) {
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/programs/${selectedProgram.programId}`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null)
        throw new Error(getApiErrorMessage(responseBody, response.status, 'Failed to delete program.'))
      }

      await loadPrograms()
      setSelectedProgramId(null)
      setIsProgramDetailVisible(false)
      notify.success('Program deleted successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete program.'
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Program management</p>
          <h1 className="page-title">Programs</h1>
          <p className="page-subtitle">
            Track project goals, objectives, activities, indicators, targets, and outcomes.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={loadPrograms} disabled={isLoading || isSaving}>
            Refresh list
          </Button>
          <Button onClick={openCreateModal}>New program</Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total programs" subtitle="All registered projects">
          <div className="metric-value">{metrics.total}</div>
          <p className="metric-meta">Across implementing organizations</p>
        </Card>
        <Card className="metric-card reveal" title="Ongoing" subtitle="Active now">
          <div className="metric-value">{metrics.ongoing}</div>
          <p className="metric-meta">Running in the current period</p>
        </Card>
        <Card className="metric-card reveal" title="Planned" subtitle="Upcoming">
          <div className="metric-value">{metrics.planned}</div>
          <p className="metric-meta">Start dates in the future</p>
        </Card>
        <Card className="metric-card reveal" title="Completed" subtitle="Closed projects">
          <div className="metric-value">{metrics.completed}</div>
          <p className="metric-meta">Reached end date</p>
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
              placeholder="Search by program ID, organization, project, objective, indicator..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)}>
              <option value="All">All organizations</option>
              {organizationOptions.map((organizationName) => (
                <option key={organizationName} value={organizationName}>
                  {organizationName}
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
            <p className="table-meta">Loading programs...</p>
          ) : rows.length === 0 ? (
            <p className="table-meta">No programs found for the selected filters.</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </Card>

      </div>

      <Modal
        open={isProgramDetailVisible && Boolean(selectedProgram)}
        title="Program detail"
        subtitle="Project summary and results framework"
        onClose={handleCloseProgramDetail}
        footer={
          selectedProgram ? (
            <div className="modal-actions">
              <Button variant="ghost" onClick={handleCloseProgramDetail} disabled={isSaving}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleCloseProgramDetail()
                  openEditModal(selectedProgram)
                }}
                disabled={isSaving}
              >
                Edit program
              </Button>
              <Button variant="danger" onClick={handleDeleteProgram} disabled={isSaving}>
                Delete program
              </Button>
            </div>
          ) : null
        }
      >
        {selectedProgram ? (
          <div className="case-detail">
            <div>
              <p className="info-label">Project information</p>
              <p className="info-value">
                {toDisplayValue(selectedProgram.projectName)} ({toDisplayValue(selectedProgram.programCode)})
              </p>
              <p className="info-meta">{toDisplayValue(selectedProgram.organizationName)}</p>
            </div>

            <div className="info-grid">
              <div>
                <p className="info-label">Status</p>
                <StatusPill value={selectedProgram.programStatus} />
              </div>
              <div>
                <p className="info-label">Start date</p>
                <p className="info-value">{formatDateValue(selectedProgram.startDate)}</p>
              </div>
              <div>
                <p className="info-label">End date</p>
                <p className="info-value">{formatDateValue(selectedProgram.endDate)}</p>
              </div>
              <div>
                <p className="info-label">Organization</p>
                <p className="info-value">{toDisplayValue(selectedProgram.organizationName)}</p>
              </div>
            </div>

            <div>
              <p className="info-label">Project goal</p>
              <p className="info-value">{toDisplayValue(selectedProgram.projectGoal)}</p>
            </div>

            <div>
              <p className="info-label">Objectives</p>
              {selectedProgram.objectives?.length ? (
                <ul className="detail-list">
                  {selectedProgram.objectives.map((objective) => (
                    <li key={objective.programObjectiveId || objective.sortOrder}>{objective.objective}</li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">Not provided</p>
              )}
            </div>

            <div>
              <p className="info-label">Activities</p>
              {selectedProgram.activities?.length ? (
                <ul className="detail-list">
                  {selectedProgram.activities.map((activity) => (
                    <li key={activity.programActivityId || activity.sortOrder}>{activity.activity}</li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">Not provided</p>
              )}
            </div>

            <div>
              <p className="info-label">Indicators and targets</p>
              {selectedProgram.indicators?.length ? (
                <ul className="detail-list">
                  {selectedProgram.indicators.map((indicator) => (
                    <li key={indicator.programIndicatorId || indicator.sortOrder}>
                      <strong>{indicator.indicator}</strong>
                      <p className="info-meta">Target: {toDisplayValue(indicator.target)}</p>
                      <p className="info-meta">Output/Outcome: {toDisplayValue(indicator.outputOrOutcome)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">Not provided</p>
              )}
            </div>

            <div>
              <p className="info-label">Assigned members</p>
              {selectedProgram.members?.length ? (
                <ul className="detail-list">
                  {selectedProgram.members.map((member) => (
                    <li key={member.programMemberId || member.memberId}>
                      {toDisplayValue(member.fullName)} ({toDisplayValue(member.memberCode)})
                      <p className="info-meta">District: {toDisplayValue(member.district)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="info-value">No members assigned to this program.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isModalOpen}
        title={editingProgramId ? 'Edit program' : 'Create new program'}
        subtitle="Capture project design and results framework"
        onClose={closeModal}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgram} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingProgramId ? 'Save changes' : 'Create program'}
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
            <span>Organization name</span>
            <input
              type="text"
              value={formValues.organizationName}
              onChange={updateField('organizationName')}
              placeholder="Name of implementing organization"
              required
            />
          </label>

          <label className="form-field">
            <span>Project name</span>
            <input
              type="text"
              value={formValues.projectName}
              onChange={updateField('projectName')}
              placeholder="Name of the project"
              required
            />
          </label>

          <label className="form-field">
            <span>Start date</span>
            <input type="date" value={formValues.startDate} onChange={updateField('startDate')} required />
          </label>

          <label className="form-field">
            <span>End date</span>
            <input type="date" value={formValues.endDate} onChange={updateField('endDate')} required />
          </label>

          <label className="form-field form-field-full">
            <span>Project goal</span>
            <textarea
              rows="3"
              value={formValues.projectGoal}
              onChange={updateField('projectGoal')}
              placeholder="Overall goal of the project"
            />
          </label>

          <div className="form-field form-field-full">
            <span>Add members to this program?</span>
            <select value={formValues.assignMembers ? 'Yes' : 'No'} onChange={updateAssignMembers}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {formValues.assignMembers ? (
              isMemberOptionsLoading ? (
                <p className="table-meta">Loading members...</p>
              ) : memberOptions.length === 0 ? (
                <p className="table-meta">No members available for assignment.</p>
              ) : (
                <div className="member-dropdown" ref={memberDropdownRef}>
                  <button
                    type="button"
                    className="member-dropdown-toggle"
                    onClick={() => setIsMemberDropdownOpen((prev) => !prev)}
                    aria-expanded={isMemberDropdownOpen}
                  >
                    <span>{selectedMembersSummary}</span>
                    <span>{isMemberDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  {isMemberDropdownOpen ? (
                    <div className="member-dropdown-menu">
                      <div className="checkbox-group">
                        {memberOptions.map((member) => (
                          <label className="checkbox-option" key={member.memberId}>
                            <input
                              type="checkbox"
                              checked={formValues.memberIds.includes(member.memberId)}
                              onChange={toggleAssignedMember(member.memberId)}
                            />
                            <span>
                              {member.memberCode} - {member.fullName} ({toDisplayValue(member.district)})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="table-meta">Open the dropdown and tick members to assign.</p>
                </div>
              )
            ) : (
              <p className="table-meta">This program will be saved without member assignments.</p>
            )}
          </div>

          <div className="form-field form-field-full repeatable-section">
            <div className="repeatable-header">
              <span>Objectives of the project</span>
              <Button variant="outline" size="sm" onClick={() => addListField('objectives')}>
                Add objective
              </Button>
            </div>
            <div className="repeatable-list">
              {formValues.objectives.map((objective, index) => (
                <div className="repeatable-row" key={`objective-${index}`}>
                  <input
                    type="text"
                    value={objective}
                    onChange={updateListField('objectives', index)}
                    placeholder={`Objective ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListField('objectives', index)}
                    disabled={formValues.objectives.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-field form-field-full repeatable-section">
            <div className="repeatable-header">
              <span>Activities</span>
              <Button variant="outline" size="sm" onClick={() => addListField('activities')}>
                Add activity
              </Button>
            </div>
            <div className="repeatable-list">
              {formValues.activities.map((activity, index) => (
                <div className="repeatable-row" key={`activity-${index}`}>
                  <input
                    type="text"
                    value={activity}
                    onChange={updateListField('activities', index)}
                    placeholder={`Activity ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListField('activities', index)}
                    disabled={formValues.activities.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-field form-field-full repeatable-section">
            <div className="repeatable-header">
              <span>Indicators, targets, and output/outcome</span>
              <Button variant="outline" size="sm" onClick={addIndicator}>
                Add indicator
              </Button>
            </div>
            <div className="repeatable-list">
              {formValues.indicators.map((entry, index) => (
                <div className="indicator-row" key={`indicator-${index}`}>
                  <input
                    type="text"
                    value={entry.indicator}
                    onChange={updateIndicatorField(index, 'indicator')}
                    placeholder={`Indicator ${index + 1}`}
                  />
                  <input
                    type="text"
                    value={entry.target}
                    onChange={updateIndicatorField(index, 'target')}
                    placeholder="Target"
                  />
                  <textarea
                    rows="2"
                    value={entry.outputOrOutcome}
                    onChange={updateIndicatorField(index, 'outputOrOutcome')}
                    placeholder="Output or outcome"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIndicator(index)}
                    disabled={formValues.indicators.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
