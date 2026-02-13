import { useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'

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
  const match = AGE_GROUPS.find((group) => age >= group.min && age <= group.max)
  return match ? match.label : 'Other'
}

const steps = ['Personal information', 'Health and disability', 'Education', 'Consent']

const rows = [
  {
    id: 'BEN-00124',
    name: 'Amina Noor',
    district: 'North',
    gender: 'Female',
    age: 28,
    education: 'Secondary',
    status: 'Unemployed',
  },
  {
    id: 'BEN-00125',
    name: 'Peter Odhiambo',
    district: 'Central',
    gender: 'Male',
    age: 34,
    education: 'Certificate',
    status: 'Employed',
  },
  {
    id: 'BEN-00126',
    name: 'Mariam Issa',
    district: 'South',
    gender: 'Female',
    age: 22,
    education: 'Primary',
    status: 'Unemployed',
  },
  {
    id: 'BEN-00127',
    name: 'Julius Langat',
    district: 'Central',
    gender: 'Male',
    age: 41,
    education: 'Diploma',
    status: 'Employed',
  },
]

const memberRows = rows.map((row) => ({
  ...row,
  ageGroup: getAgeGroup(row.age),
}))

const LOCATION_OPTIONS = [...new Set(memberRows.map((row) => row.district))].sort(compareText)
const GENDER_OPTIONS = [...new Set(memberRows.map((row) => row.gender))].sort(compareText)
const EDUCATION_OPTIONS = [...new Set(memberRows.map((row) => row.education))].sort(compareText)
const STATUS_OPTIONS = [...new Set(memberRows.map((row) => row.status))].sort(compareText)
const AGE_GROUP_OPTIONS = AGE_GROUPS.map((group) => group.label).filter((label) =>
  memberRows.some((row) => row.ageGroup === label)
)

export default function Beneficiaries() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [filters, setFilters] = useState({
    location: 'All',
    gender: 'All',
    ageGroup: 'All',
    education: 'All',
    status: 'All',
  })

  const filteredRows = useMemo(() => {
    return memberRows.filter((row) => {
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
  }, [filters])

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
        (AGE_GROUP_ORDER.get(rowA.ageGroup) ?? 999) -
        (AGE_GROUP_ORDER.get(rowB.ageGroup) ?? 999)
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
      render: (row) => (
        <span className={`member-status ${row.status.toLowerCase()}`}>{row.status}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="table-actions">
          <Button variant="ghost" size="sm">
            View profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStepIndex(0)
              setIsModalOpen(true)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const stepContent = () => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Full name</span>
              <input type="text" placeholder="Enter full name" />
            </label>
            <label className="form-field">
              <span>Gender</span>
              <select>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Date of birth</span>
              <input type="date" />
            </label>
            <label className="form-field">
              <span>District</span>
              <select>
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
              <input type="text" placeholder="List any health conditions" />
            </label>
            <label className="form-field">
              <span>Disability status</span>
              <select>
                <option>No disability</option>
                <option>Visual</option>
                <option>Hearing</option>
                <option>Mobility</option>
              </select>
            </label>
            <label className="form-field">
              <span>Assistive devices needed</span>
              <input type="text" placeholder="Wheelchair, hearing aid, etc." />
            </label>
            <label className="form-field">
              <span>Primary caregiver</span>
              <input type="text" placeholder="Name of caregiver" />
            </label>
          </div>
        )
      case 2:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Highest education level</span>
              <select>
                <option>Primary</option>
                <option>Secondary</option>
                <option>Certificate</option>
                <option>Diploma</option>
              </select>
            </label>
            <label className="form-field">
              <span>Literacy level</span>
              <select>
                <option>Basic literacy</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="form-field">
              <span>Current training</span>
              <input type="text" placeholder="Any ongoing training" />
            </label>
            <label className="form-field">
              <span>Preferred learning format</span>
              <select>
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
              <select>
                <option>Yes, signed</option>
                <option>Pending</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Data sharing consent</span>
              <select>
                <option>Approved</option>
                <option>Limited</option>
                <option>Not approved</option>
              </select>
            </label>
            <label className="form-field form-field-full">
              <span>Notes</span>
              <textarea rows="4" placeholder="Additional notes" />
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
          <Button
            onClick={() => {
              setStepIndex(0)
              setIsModalOpen(true)
            }}
          >
            Add member
          </Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total members" subtitle="Active registry">
          <div className="metric-value">4,812</div>
          <p className="metric-meta">+118 new intakes this month</p>
        </Card>
        <Card className="metric-card reveal" title="Employed" subtitle="Current placements">
          <div className="metric-value">3,079</div>
          <p className="metric-meta">Placement rate 64%</p>
        </Card>
        <Card className="metric-card reveal" title="Unemployed" subtitle="Job-seeking members">
          <div className="metric-value">1,733</div>
          <p className="metric-meta">Priority for skills matching</p>
        </Card>
        <Card className="metric-card reveal" title="Consent pending" subtitle="Data collection">
          <div className="metric-value">142</div>
          <p className="metric-meta">Follow up with field teams</p>
        </Card>
      </section>

      <Card className="reveal">
        <div className="filters-row">
          <input type="search" placeholder="Search members by name or ID" />
          <select
            value={filters.location}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, location: event.target.value }))
            }
          >
            <option value="All">All locations</option>
            {LOCATION_OPTIONS.map((location) => (
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
            {GENDER_OPTIONS.map((gender) => (
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
            {AGE_GROUP_OPTIONS.map((ageGroup) => (
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
            {EDUCATION_OPTIONS.map((level) => (
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
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} rows={sortedRows} />
      </Card>

      <Modal
        open={isModalOpen}
        title="Add or edit member"
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
              <Button>Save member</Button>
            )}
          </div>
        }
      >
        <ProgressBar steps={steps} current={stepIndex} />
        {stepContent()}
      </Modal>
    </div>
  )
}
