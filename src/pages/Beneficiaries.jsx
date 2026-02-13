import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const AGE_GROUPS = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45+', min: 45, max: Infinity },
]

const AGE_GROUP_ORDER = new Map(AGE_GROUPS.map((group, index) => [group.label, index]))

const collator = new Intl.Collator('en', { sensitivity: 'base' })
const compareText = (valueA, valueB) => collator.compare(valueA ?? '', valueB ?? '')

const getAgeGroup = (age) => {
  if (typeof age !== 'number' || Number.isNaN(age)) {
    return 'Other'
  }

  const match = AGE_GROUPS.find((group) => age >= group.min && age <= group.max)
  return match ? match.label : 'Other'
}

const steps = ['Personal information', 'Health and disability', 'Education', 'Consent']

const EMPTY_FORM = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  district: '',
  educationLevel: '',
  employmentStatus: '',
  healthConditions: '',
  disabilityStatus: '',
  assistiveDevices: '',
  primaryCaregiver: '',
  literacyLevel: '',
  currentTraining: '',
  preferredLearningFormat: '',
  consentStatus: '',
  dataSharingConsent: '',
  notes: '',
}

const DEFAULT_FILTERS = {
  location: 'All',
  gender: 'All',
  ageGroup: 'All',
  education: 'All',
  status: 'All',
}

const formatMemberCode = (memberId) => {
  if (!memberId) {
    return 'BEN-00000'
  }

  return `BEN-${String(memberId).padStart(5, '0')}`
}

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null
  }

  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age -= 1
  }

  return Math.max(age, 0)
}

const normalizeLabel = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

const formatDateForInput = (value) => {
  if (!value) {
    return ''
  }

  return value.split('T')[0]
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

export default function Beneficiaries({ session }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeMember, setActiveMember] = useState(null)
  const [formValues, setFormValues] = useState(EMPTY_FORM)

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const fetchMembers = async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        headers: authHeader,
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.succeeded) {
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load members.'))
      }

      setMembers(payload.data ?? [])
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load members.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [session?.accessToken])

  const memberRows = useMemo(() => {
    return members.map((member) => {
      const age = member.age ?? calculateAge(member.dateOfBirth)
      const statusLabel = normalizeLabel(member.employmentStatus, 'Unspecified')
      const educationLabel = normalizeLabel(member.educationLevel, 'Unspecified')

      return {
        id: member.memberCode || formatMemberCode(member.memberId),
        name: member.fullName,
        district: member.district,
        gender: member.gender,
        age: age ?? 'N/A',
        ageGroup: getAgeGroup(age),
        education: educationLabel,
        status: statusLabel,
        memberId: member.memberId,
        source: member,
      }
    })
  }, [members])

  const locationOptions = useMemo(() => {
    return [...new Set(memberRows.map((row) => row.district).filter(Boolean))].sort(compareText)
  }, [memberRows])

  const genderOptions = useMemo(() => {
    return [...new Set(memberRows.map((row) => row.gender).filter(Boolean))].sort(compareText)
  }, [memberRows])

  const educationOptions = useMemo(() => {
    return [...new Set(memberRows.map((row) => row.education).filter(Boolean))].sort(compareText)
  }, [memberRows])

  const statusOptions = useMemo(() => {
    return [...new Set(memberRows.map((row) => row.status).filter(Boolean))].sort(compareText)
  }, [memberRows])

  const ageGroupOptions = useMemo(() => {
    return AGE_GROUPS.map((group) => group.label).filter((label) =>
      memberRows.some((row) => row.ageGroup === label),
    )
  }, [memberRows])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return memberRows.filter((row) => {
      if (term) {
        const inName = row.name?.toLowerCase().includes(term)
        const inId = row.id?.toLowerCase().includes(term)
        if (!inName && !inId) {
          return false
        }
      }

      if (filters.location !== 'All' && row.district !== filters.location) {
        return false
      }
      if (filters.gender !== 'All' && row.gender !== filters.gender) {
        return false
      }
      if (filters.ageGroup !== 'All' && row.ageGroup !== filters.ageGroup) {
        return false
      }
      if (filters.education !== 'All' && row.education !== filters.education) {
        return false
      }
      if (filters.status !== 'All' && row.status !== filters.status) {
        return false
      }
      return true
    })
  }, [filters, memberRows, searchTerm])

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((rowA, rowB) => {
      const locationCompare = compareText(rowA.district, rowB.district)
      if (locationCompare !== 0) {
        return locationCompare
      }

      const genderCompare = compareText(rowA.gender, rowB.gender)
      if (genderCompare !== 0) {
        return genderCompare
      }

      const ageGroupCompare =
        (AGE_GROUP_ORDER.get(rowA.ageGroup) ?? 999) - (AGE_GROUP_ORDER.get(rowB.ageGroup) ?? 999)
      if (ageGroupCompare !== 0) {
        return ageGroupCompare
      }

      const educationCompare = compareText(rowA.education, rowB.education)
      if (educationCompare !== 0) {
        return educationCompare
      }

      const statusCompare = compareText(rowA.status, rowB.status)
      if (statusCompare !== 0) {
        return statusCompare
      }

      return compareText(rowA.name, rowB.name)
    })
  }, [filteredRows])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'district', label: 'Location' },
    { key: 'gender', label: 'Gender' },
    { key: 'ageGroup', label: 'Age group' },
    { key: 'age', label: 'Age' },
    { key: 'education', label: 'Education level' },
    {
      key: 'status',
      label: 'Employment status',
      render: (row) => {
        const statusClass = row.status ? row.status.toLowerCase().replace(/\s+/g, '-') : 'unknown'
        return <span className={`member-status ${statusClass}`}>{row.status}</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <Button variant="ghost" size="sm">
            View profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleEditMember(row.source)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const totalMembers = members.length
  const employedCount = members.filter(
    (member) => member.employmentStatus?.toLowerCase() === 'employed',
  ).length
  const unemployedCount = members.filter(
    (member) => member.employmentStatus?.toLowerCase() === 'unemployed',
  ).length
  const consentPendingCount = members.filter((member) =>
    member.consentStatus?.toLowerCase().includes('pending'),
  ).length

  const updateField = (field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddMember = () => {
    setActiveMember(null)
    setFormValues(EMPTY_FORM)
    setSaveError('')
    setStepIndex(0)
    setIsModalOpen(true)
  }

  function handleEditMember(member) {
    setActiveMember(member)
    setFormValues({
      fullName: member.fullName ?? '',
      gender: member.gender ?? '',
      dateOfBirth: formatDateForInput(member.dateOfBirth),
      district: member.district ?? '',
      educationLevel: member.educationLevel ?? '',
      employmentStatus: member.employmentStatus ?? '',
      healthConditions: member.healthConditions ?? '',
      disabilityStatus: member.disabilityStatus ?? '',
      assistiveDevices: member.assistiveDevices ?? '',
      primaryCaregiver: member.primaryCaregiver ?? '',
      literacyLevel: member.literacyLevel ?? '',
      currentTraining: member.currentTraining ?? '',
      preferredLearningFormat: member.preferredLearningFormat ?? '',
      consentStatus: member.consentStatus ?? '',
      dataSharingConsent: member.dataSharingConsent ?? '',
      notes: member.notes ?? '',
    })
    setSaveError('')
    setStepIndex(0)
    setIsModalOpen(true)
  }

  const handleSaveMember = async () => {
    setIsSaving(true)
    setSaveError('')

    try {
      const payload = {
        fullName: formValues.fullName.trim(),
        gender: formValues.gender.trim(),
        dateOfBirth: formValues.dateOfBirth ? formValues.dateOfBirth : null,
        district: formValues.district.trim(),
        educationLevel: formValues.educationLevel || null,
        employmentStatus: formValues.employmentStatus || null,
        healthConditions: formValues.healthConditions || null,
        disabilityStatus: formValues.disabilityStatus || null,
        assistiveDevices: formValues.assistiveDevices || null,
        primaryCaregiver: formValues.primaryCaregiver || null,
        literacyLevel: formValues.literacyLevel || null,
        currentTraining: formValues.currentTraining || null,
        preferredLearningFormat: formValues.preferredLearningFormat || null,
        consentStatus: formValues.consentStatus || null,
        dataSharingConsent: formValues.dataSharingConsent || null,
        notes: formValues.notes || null,
      }

      const url = activeMember
        ? `${API_BASE_URL}/api/members/${activeMember.memberId}`
        : `${API_BASE_URL}/api/members`

      const response = await fetch(url, {
        method: activeMember ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok || !responseBody?.succeeded) {
        throw new Error(getApiErrorMessage(responseBody, response.status, 'Failed to save member.'))
      }

      setIsModalOpen(false)
      setActiveMember(null)
      setFormValues(EMPTY_FORM)
      setStepIndex(0)
      await fetchMembers()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save member.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave =
    formValues.fullName.trim().length > 0 &&
    formValues.gender.trim().length > 0 &&
    formValues.district.trim().length > 0

  const stepContent = () => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Enter full name"
                value={formValues.fullName}
                onChange={updateField('fullName')}
              />
            </label>
            <label className="form-field">
              <span>Gender</span>
              <select value={formValues.gender} onChange={updateField('gender')}>
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Date of birth</span>
              <input
                type="date"
                value={formValues.dateOfBirth}
                onChange={updateField('dateOfBirth')}
              />
            </label>
            <label className="form-field">
              <span>District</span>
              <select value={formValues.district} onChange={updateField('district')}>
                <option value="">Select district</option>
                <option>North</option>
                <option>Central</option>
                <option>South</option>
              </select>
            </label>
          </div>
        )
      case 1:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Health conditions</span>
              <input
                type="text"
                placeholder="List any health conditions"
                value={formValues.healthConditions}
                onChange={updateField('healthConditions')}
              />
            </label>
            <label className="form-field">
              <span>Disability status</span>
              <select value={formValues.disabilityStatus} onChange={updateField('disabilityStatus')}>
                <option value="">Select status</option>
                <option>No disability</option>
                <option>Visual</option>
                <option>Hearing</option>
                <option>Mobility</option>
              </select>
            </label>
            <label className="form-field">
              <span>Assistive devices needed</span>
              <input
                type="text"
                placeholder="Wheelchair, hearing aid, etc."
                value={formValues.assistiveDevices}
                onChange={updateField('assistiveDevices')}
              />
            </label>
            <label className="form-field">
              <span>Primary caregiver</span>
              <input
                type="text"
                placeholder="Name of caregiver"
                value={formValues.primaryCaregiver}
                onChange={updateField('primaryCaregiver')}
              />
            </label>
          </div>
        )
      case 2:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Employment status</span>
              <select value={formValues.employmentStatus} onChange={updateField('employmentStatus')}>
                <option value="">Select status</option>
                <option>Employed</option>
                <option>Unemployed</option>
                <option>Self-employed</option>
                <option>Student</option>
              </select>
            </label>
            <label className="form-field">
              <span>Highest education level</span>
              <select value={formValues.educationLevel} onChange={updateField('educationLevel')}>
                <option value="">Select level</option>
                <option>Primary</option>
                <option>Secondary</option>
                <option>Certificate</option>
                <option>Diploma</option>
              </select>
            </label>
            <label className="form-field">
              <span>Literacy level</span>
              <select value={formValues.literacyLevel} onChange={updateField('literacyLevel')}>
                <option value="">Select level</option>
                <option>Basic literacy</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="form-field">
              <span>Current training</span>
              <input
                type="text"
                placeholder="Any ongoing training"
                value={formValues.currentTraining}
                onChange={updateField('currentTraining')}
              />
            </label>
            <label className="form-field">
              <span>Preferred learning format</span>
              <select
                value={formValues.preferredLearningFormat}
                onChange={updateField('preferredLearningFormat')}
              >
                <option value="">Select format</option>
                <option>In-person</option>
                <option>Apprenticeship</option>
                <option>Online</option>
              </select>
            </label>
          </div>
        )
      case 3:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Consent provided</span>
              <select value={formValues.consentStatus} onChange={updateField('consentStatus')}>
                <option value="">Select status</option>
                <option>Yes, signed</option>
                <option>Pending</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Data sharing consent</span>
              <select
                value={formValues.dataSharingConsent}
                onChange={updateField('dataSharingConsent')}
              >
                <option value="">Select status</option>
                <option>Approved</option>
                <option>Limited</option>
                <option>Not approved</option>
              </select>
            </label>
            <label className="form-field form-field-full">
              <span>Notes</span>
              <textarea
                rows="4"
                placeholder="Additional notes"
                value={formValues.notes}
                onChange={updateField('notes')}
              />
            </label>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Member registry</p>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Review and maintain the national member registry.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline">Import CSV</Button>
          <Button onClick={handleAddMember}>Add member</Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total members" subtitle="Active registry">
          <div className="metric-value">{totalMembers.toLocaleString()}</div>
          <p className="metric-meta">Updated from live registry</p>
        </Card>
        <Card className="metric-card reveal" title="Employed" subtitle="Current placements">
          <div className="metric-value">{employedCount.toLocaleString()}</div>
          <p className="metric-meta">Members marked employed</p>
        </Card>
        <Card className="metric-card reveal" title="Unemployed" subtitle="Job-seeking members">
          <div className="metric-value">{unemployedCount.toLocaleString()}</div>
          <p className="metric-meta">Priority for skills matching</p>
        </Card>
        <Card className="metric-card reveal" title="Consent pending" subtitle="Data collection">
          <div className="metric-value">{consentPendingCount.toLocaleString()}</div>
          <p className="metric-meta">Follow up with field teams</p>
        </Card>
      </section>

      <Card className="reveal">
        {pageError ? <p className="alert">{pageError}</p> : null}
        <div className="filters-row">
          <input
            type="search"
            placeholder="Search members by name or ID"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            value={filters.location}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, location: event.target.value }))
            }
          >
            <option value="All">All locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <select
            value={filters.gender}
            onChange={(event) => setFilters((prev) => ({ ...prev, gender: event.target.value }))}
          >
            <option value="All">All genders</option>
            {genderOptions.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
          <select
            value={filters.ageGroup}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, ageGroup: event.target.value }))
            }
          >
            <option value="All">All age groups</option>
            {ageGroupOptions.map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>
                {ageGroup}
              </option>
            ))}
          </select>
          <select
            value={filters.education}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, education: event.target.value }))
            }
          >
            <option value="All">All education levels</option>
            {educationOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="All">All employment statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <p className="table-meta">Loading members...</p>
        ) : (
          <DataTable columns={columns} rows={sortedRows} />
        )}
      </Card>

      <Modal
        open={isModalOpen}
        title={activeMember ? 'Edit member' : 'Add member'}
        subtitle="Complete the four-step intake form"
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button onClick={() => setStepIndex((prev) => prev + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSaveMember} disabled={!canSave || isSaving}>
                {isSaving ? 'Saving...' : activeMember ? 'Update member' : 'Save member'}
              </Button>
            )}
          </div>
        }
      >
        <ProgressBar steps={steps} current={stepIndex} />
        {saveError ? <p className="alert">{saveError}</p> : null}
        {stepContent()}
      </Modal>
    </div>
  )
}
