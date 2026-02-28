import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import { useNotify } from '../hooks/useNotify'

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

const getAgeGroup = (age) => {
  if (typeof age !== 'number' || Number.isNaN(age)) {
    return 'Other'
  }

  const match = AGE_GROUPS.find((group) => age >= group.min && age <= group.max)
  return match ? match.label : 'Other'
}

const OTHER_OPTION = 'Other'

const BASE_SKILL_CATEGORIES = [
  'Technical/Vocational',
  'Professional/Academic',
  'Business and Entrepreneurship',
]
const SKILL_CATEGORIES = [...BASE_SKILL_CATEGORIES, OTHER_OPTION]

const SKILLS_BY_CATEGORY = {
  'Technical/Vocational': [
    'Tailoring',
    'Carpentry',
    'Welding',
    'Farming',
    'Livestock keeping',
    'Hairdressing/Beauty',
    'Catering/Cooking',
    'Mechanics',
    'ICT/Computer skills',
    'Phone repair',
    'Electrical installation',
  ],
  'Professional/Academic': [
    'Teaching',
    'Accounting/Bookkeeping',
    'Nursing/Health',
    'Social work',
    'Administration',
    'Advocacy/Human rights',
    'Community Development/Mobilization',
    'Project Management',
    'Research/Data Collection',
  ],
  'Business and Entrepreneurship': [
    'Running small business',
    'Marketing',
    'Financial literacy',
    'Savings groups (VSLA)',
    'Business planning',
    'Record keeping',
  ],
}

const BASE_SKILL_LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Professional']
const SKILL_LEVELS = [...BASE_SKILL_LEVELS, OTHER_OPTION]
const EMPLOYMENT_STATUSES = ['Employed', 'Self-employed', 'Unemployed', 'Student']
const EMPLOYER_SECTORS = ['Government', 'NGO', 'Private', 'Informal']
const MONTHLY_INCOME_RANGES = ['Below MK50,000', 'MK50,000-MK150,000', 'MK150,000-MK300,00','MK300,000-MK500,000','MK500,000-MK1,000,000','Above MK1,000,000']
const TRAINING_AREAS = ['Business', 'Vocational', 'ICT', 'Professional', 'Agriculture']
const TRAINING_FORMATS = ['Short course', 'Long-term', 'Apprenticeship', 'Online']
const TRAINING_BARRIERS = [
  'Transport',
  'Fees',
  'Vision challenges',
  'Discrimination',
  'Family responsibilities',
]
const PROGRAM_AREAS = [
  'Skills training',
  'Business startup support',
  'Internship/job Placement',
  'Advocacy and leadership roles',
  'Peer mentoring',
]

const steps = [
  'Personal information',
  'Health and disability',
  'Skills profile',
  'Employment status',
  'Training needs',
  'Economic opportunities',
  'Program participation',
  'Consent',
]

const createEmptyParentContact = () => ({
  relationship: '',
  fullName: '',
  phoneNumber: '',
  isApamMember: '',
  parentMemberCode: '',
})

const createEmptySkill = () => ({
  skillCategory: '',
  skillCategoryOther: '',
  skillName: '',
  skillLevel: '',
  skillLevelOther: '',
  isCertified: '',
  yearsOfExperience: '',
})

const createDefaultProgramInterests = () =>
  PROGRAM_AREAS.map((programArea) => ({
    programArea,
    interested: '',
  }))

const createEmptyForm = () => ({
  fullName: '',
  gender: '',
  dateOfBirth: '',
  nationalId: '',
  phoneNumber: '',
  alternativeContact: '',
  district: '',
  districtOfOrigin: '',
  traditionalAuthority: '',
  villageArea: '',
  isRegisteredApamMember: '',
  maritalStatus: '',
  isMarriedToFellowMember: '',
  spouseMemberCode: '',
  spouseFullName: '',
  spousePhoneNumber: '',
  parentContacts: [createEmptyParentContact()],
  educationLevel: '',
  personsWithAlbinismInFamily: '',
  numberOfChildrenInPreschool: '',
  numberOfChildrenInPrimarySchool: '',
  numberOfChildrenInSecondarySchool: '',
  skills: [createEmptySkill()],
  currentlyRunsBusiness: '',
  typeOfBusiness: '',
  yearsInOperation: '',
  numberOfEmployees: '',
  currentEmploymentStatus: '',
  jobTitle: '',
  employerSector: '',
  monthlyIncomeRange: '',
  activelySeekingWork: '',
  employmentStatus: '',
  healthConditions: '',
  disabilityStatus: '',
  assistiveDevices: '',
  hasAdditionalDisability: '',
  additionalDisabilityDetails: '',
  assistiveDeviceUsage: '',
  discriminationInEducationOrEmployment: '',
  skinCancerDiagnosis: '',
  skinCancerType: '',
  skinCancerStage: '',
  currentlyReceivingTreatment: '',
  treatmentLocation: '',
  needsSupportAccessingTreatment: '',
  primaryCaregiver: '',
  literacyLevel: '',
  currentTraining: '',
  preferredLearningFormat: '',
  desiredNewSkills: '',
  preferredTrainingAreas: [],
  preferredTrainingFormats: [],
  trainingBarriers: [],
  hasLandForFarming: '',
  hasStartupCapital: '',
  receivedBusinessGrantOrLoan: '',
  partOfSavingsOrCooperative: '',
  beneficiaryOfGovernmentOrOtherSocialSchemes: '',
  programInterests: createDefaultProgramInterests(),
  consentStatus: '',
  dataSharingConsent: '',
  notes: '',
})

const DEFAULT_FILTERS = {
  location: 'All',
  gender: 'All',
  ageGroup: 'All',
  education: 'All',
  status: 'All',
}

const FILTER_TYPE_OPTIONS = [
  { key: 'location', label: 'Location' },
  { key: 'gender', label: 'Gender' },
  { key: 'ageGroup', label: 'Age group' },
  { key: 'education', label: 'Education level' },
  { key: 'status', label: 'Employment status' },
]

const EXPORT_FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'excel', label: 'Excel (.xls)' },
  { value: 'word', label: 'Word (.doc)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

const EXPORT_COLUMNS = [
  { key: 'memberCode', label: 'Member Code' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'district', label: 'District' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'ageGroup', label: 'Age Group' },
  { key: 'education', label: 'Education Level' },
  { key: 'employmentStatus', label: 'Employment Status' },
]

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

  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }

  return fallbackMessage
}

const isKnownSkillCategory = (value) =>
  typeof value === 'string' && BASE_SKILL_CATEGORIES.includes(value)

const isKnownSkillLevel = (value) =>
  typeof value === 'string' && BASE_SKILL_LEVELS.includes(value)

const resolveSkillEntryValue = (selectedValue, otherValue) => {
  if (selectedValue === OTHER_OPTION) {
    const customValue = String(otherValue ?? '').trim()
    return customValue || null
  }

  const normalized = String(selectedValue ?? '').trim()
  return normalized || null
}

const toDisplayValue = (value) => {
  if (value === 0) {
    return '0'
  }

  if (value === null || value === undefined) {
    return 'Not provided'
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : 'Not provided'
}

const toDisplayList = (values) => {
  if (!Array.isArray(values)) {
    return 'Not provided'
  }

  const normalized = values.map((value) => String(value ?? '').trim()).filter(Boolean)
  return normalized.length > 0 ? normalized.join(', ') : 'Not provided'
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const escapeCsv = (value) => {
  const serialized = String(value ?? '')
  if (serialized.includes('"') || serialized.includes(',') || serialized.includes('\n')) {
    return `"${serialized.replaceAll('"', '""')}"`
  }

  return serialized
}

const escapeXml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const buildExportHtmlDocument = (title, rows) => {
  const headers = EXPORT_COLUMNS.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${EXPORT_COLUMNS.map(
          (column) => `<td>${escapeHtml(row[column.key])}</td>`,
        ).join('')}</tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      p { margin: 0 0 16px; color: #4b5563; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
      th { background: #f3f4f6; font-weight: 700; }
      tr:nth-child(even) td { background: #f9fafb; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`
}

const buildExportExcelXml = (rows) => {
  const headerXml = EXPORT_COLUMNS.map(
    (column) =>
      `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`,
  ).join('')

  const rowXml = rows
    .map(
      (row) =>
        `<Row>${EXPORT_COLUMNS.map(
          (column) =>
            `<Cell><Data ss:Type="String">${escapeXml(row[column.key])}</Data></Cell>`,
        ).join('')}</Row>`,
    )
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Members">
    <Table>
      <Row>${headerXml}</Row>
      ${rowXml}
    </Table>
  </Worksheet>
</Workbook>`
}

const triggerDownload = (content, mimeType, filename) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function Members({ session }) {
  const notify = useNotify()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportError, setExportError] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeMember, setActiveMember] = useState(null)
  const [profileMember, setProfileMember] = useState(null)
  const [formValues, setFormValues] = useState(() => createEmptyForm())
  const [activeFilterTypes, setActiveFilterTypes] = useState([])
  const [filterTypePickerValue, setFilterTypePickerValue] = useState('')

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load members.'
      setPageError(errorMessage)
      notify.error(errorMessage)
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
    return [...new Set([...MALAWI_DISTRICTS, ...memberRows.map((row) => row.district).filter(Boolean)])].sort(
      compareText,
    )
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

  const filterValueOptions = useMemo(
    () => ({
      location: locationOptions,
      gender: genderOptions,
      ageGroup: ageGroupOptions,
      education: educationOptions,
      status: statusOptions,
    }),
    [locationOptions, genderOptions, ageGroupOptions, educationOptions, statusOptions],
  )

  const availableFilterTypes = useMemo(
    () => FILTER_TYPE_OPTIONS.filter((option) => !activeFilterTypes.includes(option.key)),
    [activeFilterTypes],
  )

  const addFilterType = (filterType) => {
    if (!filterType) {
      return
    }

    setActiveFilterTypes((prev) => (prev.includes(filterType) ? prev : [...prev, filterType]))
  }

  const removeFilterType = (filterType) => {
    setActiveFilterTypes((prev) => prev.filter((type) => type !== filterType))
    setFilters((prev) => ({ ...prev, [filterType]: 'All' }))
  }

  const handleFilterTypeSelection = (event) => {
    const { value } = event.target
    addFilterType(value)
    setFilterTypePickerValue('')
  }

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
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              handleViewMember(row.source)
            }}
          >
            View profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              handleEditMember(row.source)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const exportRows = useMemo(
    () =>
      sortedRows.map((row) => ({
        memberCode: row.id ?? '',
        fullName: row.name ?? '',
        district: row.district ?? '',
        gender: row.gender ?? '',
        age: row.age ?? '',
        ageGroup: row.ageGroup ?? '',
        education: row.education ?? '',
        employmentStatus: row.status ?? '',
      })),
    [sortedRows],
  )

  const openExportModal = () => {
    setExportError('')
    setExportFormat('csv')
    setIsExportModalOpen(true)
  }

  const closeExportModal = () => {
    setIsExportModalOpen(false)
    setExportError('')
  }

  const handleExportMembers = () => {
    if (exportRows.length === 0) {
      const errorMessage = 'There is no data to export for the current filter selection.'
      setExportError(errorMessage)
      notify.error(errorMessage)
      return
    }

    const dateStamp = new Date().toISOString().slice(0, 10)
    const fileBase = `members-${dateStamp}`
    const title = 'APAM Members Export'

    if (exportFormat === 'csv') {
      const header = EXPORT_COLUMNS.map((column) => escapeCsv(column.label)).join(',')
      const lines = exportRows.map((row) =>
        EXPORT_COLUMNS.map((column) => escapeCsv(row[column.key])).join(','),
      )
      triggerDownload(`${header}\n${lines.join('\n')}`, 'text/csv;charset=utf-8', `${fileBase}.csv`)
      closeExportModal()
      notify.success('Members exported successfully as CSV.')
      return
    }

    if (exportFormat === 'excel') {
      const xml = buildExportExcelXml(exportRows)
      triggerDownload(xml, 'application/vnd.ms-excel', `${fileBase}.xls`)
      closeExportModal()
      notify.success('Members exported successfully as Excel.')
      return
    }

    if (exportFormat === 'word') {
      const html = buildExportHtmlDocument(title, exportRows)
      triggerDownload(html, 'application/msword', `${fileBase}.doc`)
      closeExportModal()
      notify.success('Members exported successfully as Word document.')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) {
      const errorMessage = 'Popup was blocked. Allow popups to export as PDF.'
      setExportError(errorMessage)
      notify.error(errorMessage)
      return
    }

    printWindow.document.open()
    printWindow.document.write(buildExportHtmlDocument(title, exportRows))
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 300)
    closeExportModal()
    notify.success('Print dialog opened for PDF export.')
  }

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

  const memberAge = useMemo(() => calculateAge(formValues.dateOfBirth), [formValues.dateOfBirth])
  const isMinor = typeof memberAge === 'number' && memberAge < 18
  const isMarried = formValues.maritalStatus === 'Married'
  const isMarriedToFellowMember = isMarried && formValues.isMarriedToFellowMember === 'Yes'
  const isRunningBusiness = formValues.currentlyRunsBusiness === 'Yes'
  const isEmployedOrSelfEmployed =
    formValues.currentEmploymentStatus === 'Employed' ||
    formValues.currentEmploymentStatus === 'Self-employed'
  const isUnemployed = formValues.currentEmploymentStatus === 'Unemployed'
  const personsWithAlbinismInFamilyCount = Number.parseInt(formValues.personsWithAlbinismInFamily, 10)
  const shouldShowChildrenSchoolQuestions =
    !Number.isNaN(personsWithAlbinismInFamilyCount) && personsWithAlbinismInFamilyCount > 0

  const updateField = (field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => {
      const next = { ...prev, [field]: value }

      if (field === 'hasAdditionalDisability' && value !== 'Yes') {
        next.additionalDisabilityDetails = ''
      }

      if (field === 'skinCancerDiagnosis' && value !== 'Yes') {
        next.skinCancerType = ''
        next.skinCancerStage = ''
        next.currentlyReceivingTreatment = ''
        next.treatmentLocation = ''
        next.needsSupportAccessingTreatment = ''
      }

      if (field === 'currentlyReceivingTreatment' && value !== 'Yes') {
        next.treatmentLocation = ''
      }

      if (field === 'maritalStatus' && value !== 'Married') {
        next.isMarriedToFellowMember = ''
        next.spouseMemberCode = ''
        next.spouseFullName = ''
        next.spousePhoneNumber = ''
      }

      if (field === 'isMarriedToFellowMember' && value !== 'Yes') {
        next.spouseMemberCode = ''
        next.spouseFullName = ''
        next.spousePhoneNumber = ''
      }

      if (field === 'currentlyRunsBusiness' && value !== 'Yes') {
        next.typeOfBusiness = ''
        next.yearsInOperation = ''
        next.numberOfEmployees = ''
      }

      if (field === 'currentEmploymentStatus') {
        next.employmentStatus = value

        if (value !== 'Employed' && value !== 'Self-employed') {
          next.jobTitle = ''
          next.employerSector = ''
          next.monthlyIncomeRange = ''
        }

        if (value !== 'Unemployed') {
          next.activelySeekingWork = ''
        }
      }

      if (field === 'personsWithAlbinismInFamily') {
        const parsedCount = Number.parseInt(value, 10)
        if (Number.isNaN(parsedCount) || parsedCount <= 0) {
          next.numberOfChildrenInPreschool = ''
          next.numberOfChildrenInPrimarySchool = ''
          next.numberOfChildrenInSecondarySchool = ''
        }
      }

      return next
    })
  }

  const updateSkillEntry = (index, field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => {
      const skills = prev.skills.map((skill, currentIndex) =>
        currentIndex === index ? { ...skill, [field]: value } : skill,
      )

      if (field === 'skillCategory') {
        skills[index] = {
          ...skills[index],
          skillName: '',
          skillCategoryOther: value === OTHER_OPTION ? skills[index].skillCategoryOther : '',
        }
      }

      if (field === 'skillLevel' && value !== OTHER_OPTION) {
        skills[index] = { ...skills[index], skillLevelOther: '' }
      }

      return { ...prev, skills }
    })
  }

  const addSkillEntry = () => {
    setFormValues((prev) => ({ ...prev, skills: [...prev.skills, createEmptySkill()] }))
  }

  const removeSkillEntry = (index) => {
    setFormValues((prev) => {
      if (prev.skills.length <= 1) {
        return { ...prev, skills: [createEmptySkill()] }
      }

      return { ...prev, skills: prev.skills.filter((_, currentIndex) => currentIndex !== index) }
    })
  }

  const toggleTrainingSelection = (field, option) => () => {
    setFormValues((prev) => {
      const currentValues = prev[field]
      const nextValues = currentValues.includes(option)
        ? currentValues.filter((value) => value !== option)
        : [...currentValues, option]

      return { ...prev, [field]: nextValues }
    })
  }

  const updateProgramInterest = (programArea) => (event) => {
    const { value } = event.target
    setFormValues((prev) => ({
      ...prev,
      programInterests: prev.programInterests.map((entry) =>
        entry.programArea === programArea ? { ...entry, interested: value } : entry,
      ),
    }))
  }

  const updateParentContact = (index, field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => {
      const parentContacts = prev.parentContacts.map((parent, currentIndex) =>
        currentIndex === index ? { ...parent, [field]: value } : parent,
      )

      if (field === 'isApamMember' && value !== 'Yes') {
        parentContacts[index].parentMemberCode = ''
      }

      return { ...prev, parentContacts }
    })
  }

  const addParentContact = () => {
    setFormValues((prev) => {
      if (prev.parentContacts.length >= 2) {
        return prev
      }

      return { ...prev, parentContacts: [...prev.parentContacts, createEmptyParentContact()] }
    })
  }

  const removeParentContact = (index) => {
    setFormValues((prev) => {
      if (prev.parentContacts.length <= 1) {
        return { ...prev, parentContacts: [createEmptyParentContact()] }
      }

      return { ...prev, parentContacts: prev.parentContacts.filter((_, currentIndex) => currentIndex !== index) }
    })
  }

  const handleViewMember = (member) => {
    setProfileMember(member)
  }

  const closeProfileModal = () => {
    setProfileMember(null)
  }

  const handleEditFromProfile = () => {
    if (!profileMember) {
      return
    }

    const selectedMember = profileMember
    closeProfileModal()
    handleEditMember(selectedMember)
  }

  const handleAddMember = () => {
    setActiveMember(null)
    setFormValues(createEmptyForm())
    setSaveError('')
    setStepIndex(0)
    setIsModalOpen(true)
  }

  function handleEditMember(member) {
    const parentContacts =
      member.parentContacts?.length > 0
        ? member.parentContacts.map((parent) => ({
            relationship: parent.relationship ?? '',
            fullName: parent.fullName ?? '',
            phoneNumber: parent.phoneNumber ?? '',
            isApamMember: parent.isApamMember ?? '',
            parentMemberCode: parent.parentMemberCode ?? '',
          }))
        : [createEmptyParentContact()]

    const skills =
      member.skills?.length > 0
        ? member.skills.map((skill) => {
            const incomingCategory = skill.skillCategory ?? ''
            const incomingLevel = skill.skillLevel ?? ''
            const categoryIsKnown = isKnownSkillCategory(incomingCategory)
            const levelIsKnown = isKnownSkillLevel(incomingLevel)

            return {
              skillCategory: categoryIsKnown ? incomingCategory : incomingCategory ? OTHER_OPTION : '',
              skillCategoryOther: categoryIsKnown ? '' : incomingCategory,
              skillName: skill.skillName ?? '',
              skillLevel: levelIsKnown ? incomingLevel : incomingLevel ? OTHER_OPTION : '',
              skillLevelOther: levelIsKnown ? '' : incomingLevel,
              isCertified: skill.isCertified ?? '',
              yearsOfExperience:
                typeof skill.yearsOfExperience === 'number' ? String(skill.yearsOfExperience) : '',
            }
          })
        : [createEmptySkill()]

    const programInterests = createDefaultProgramInterests().map((defaultEntry) => {
      const match = member.programInterests?.find(
        (interest) => interest.programArea === defaultEntry.programArea,
      )

      return {
        ...defaultEntry,
        interested: match?.interested ?? '',
      }
    })

    const employmentProfile = member.employmentProfile ?? {}
    const businessProfile = member.businessProfile ?? {}
    const trainingProfile = member.trainingProfile ?? {}
    const economicOpportunityProfile = member.economicOpportunityProfile ?? {}

    setActiveMember(member)
    setFormValues({
      fullName: member.fullName ?? '',
      gender: member.gender ?? '',
      dateOfBirth: formatDateForInput(member.dateOfBirth),
      nationalId: member.nationalId ?? '',
      phoneNumber: member.phoneNumber ?? '',
      alternativeContact: member.alternativeContact ?? '',
      district: member.district ?? '',
      districtOfOrigin: member.districtOfOrigin ?? '',
      traditionalAuthority: member.traditionalAuthority ?? '',
      villageArea: member.villageArea ?? '',
      isRegisteredApamMember: member.isRegisteredApamMember ?? '',
      maritalStatus: member.maritalStatus ?? '',
      isMarriedToFellowMember: member.isMarriedToFellowMember ?? '',
      spouseMemberCode: member.spouseMemberCode ?? '',
      spouseFullName: member.spouseFullName ?? '',
      spousePhoneNumber: member.spousePhoneNumber ?? '',
      personsWithAlbinismInFamily:
        typeof member.personsWithAlbinismInFamily === 'number'
          ? String(member.personsWithAlbinismInFamily)
          : '',
      numberOfChildrenInPreschool:
        typeof member.numberOfChildrenInPreschool === 'number'
          ? String(member.numberOfChildrenInPreschool)
          : '',
      numberOfChildrenInPrimarySchool:
        typeof member.numberOfChildrenInPrimarySchool === 'number'
          ? String(member.numberOfChildrenInPrimarySchool)
          : '',
      numberOfChildrenInSecondarySchool:
        typeof member.numberOfChildrenInSecondarySchool === 'number'
          ? String(member.numberOfChildrenInSecondarySchool)
          : '',
      parentContacts,
      educationLevel: member.educationLevel ?? '',
      skills,
      currentlyRunsBusiness: businessProfile.currentlyRunsBusiness ?? '',
      typeOfBusiness: businessProfile.typeOfBusiness ?? '',
      yearsInOperation:
        typeof businessProfile.yearsInOperation === 'number'
          ? String(businessProfile.yearsInOperation)
          : '',
      numberOfEmployees:
        typeof businessProfile.numberOfEmployees === 'number'
          ? String(businessProfile.numberOfEmployees)
          : '',
      currentEmploymentStatus:
        employmentProfile.currentEmploymentStatus ?? member.employmentStatus ?? '',
      jobTitle: employmentProfile.jobTitle ?? '',
      employerSector: employmentProfile.employerSector ?? '',
      monthlyIncomeRange: employmentProfile.monthlyIncomeRange ?? '',
      activelySeekingWork: employmentProfile.activelySeekingWork ?? '',
      employmentStatus:
        employmentProfile.currentEmploymentStatus ?? member.employmentStatus ?? '',
      healthConditions: member.healthConditions ?? '',
      disabilityStatus: member.disabilityStatus ?? '',
      assistiveDevices: member.assistiveDevices ?? '',
      hasAdditionalDisability: member.hasAdditionalDisability ?? '',
      additionalDisabilityDetails: member.additionalDisabilityDetails ?? '',
      assistiveDeviceUsage: member.assistiveDeviceUsage ?? '',
      discriminationInEducationOrEmployment: member.discriminationInEducationOrEmployment ?? '',
      skinCancerDiagnosis: member.skinCancerDiagnosis ?? '',
      skinCancerType: member.skinCancerType ?? '',
      skinCancerStage: member.skinCancerStage ?? '',
      currentlyReceivingTreatment: member.currentlyReceivingTreatment ?? '',
      treatmentLocation: member.treatmentLocation ?? '',
      needsSupportAccessingTreatment: member.needsSupportAccessingTreatment ?? '',
      primaryCaregiver: member.primaryCaregiver ?? '',
      literacyLevel: member.literacyLevel ?? '',
      currentTraining: member.currentTraining ?? '',
      preferredLearningFormat: member.preferredLearningFormat ?? '',
      desiredNewSkills: trainingProfile.desiredNewSkills ?? '',
      preferredTrainingAreas: trainingProfile.preferredTrainingAreas ?? [],
      preferredTrainingFormats: trainingProfile.preferredTrainingFormats ?? [],
      trainingBarriers: trainingProfile.trainingBarriers ?? [],
      hasLandForFarming: economicOpportunityProfile.hasLandForFarming ?? '',
      hasStartupCapital: economicOpportunityProfile.hasStartupCapital ?? '',
      receivedBusinessGrantOrLoan: economicOpportunityProfile.receivedBusinessGrantOrLoan ?? '',
      partOfSavingsOrCooperative: economicOpportunityProfile.partOfSavingsOrCooperative ?? '',
      beneficiaryOfGovernmentOrOtherSocialSchemes:
        economicOpportunityProfile.beneficiaryOfGovernmentOrOtherSocialSchemes ?? '',
      programInterests,
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
      const hasMissingSkillCategoryOther = formValues.skills.some(
        (skill) => skill.skillCategory === OTHER_OPTION && !String(skill.skillCategoryOther ?? '').trim(),
      )
      if (hasMissingSkillCategoryOther) {
        throw new Error('Please specify the skill category for entries marked as Other.')
      }

      const hasMissingSkillLevelOther = formValues.skills.some(
        (skill) => skill.skillLevel === OTHER_OPTION && !String(skill.skillLevelOther ?? '').trim(),
      )
      if (hasMissingSkillLevelOther) {
        throw new Error('Please specify the skill level for entries marked as Other.')
      }

      const hasKnownAge = typeof memberAge === 'number'
      const parentContacts = isMinor
        ? formValues.parentContacts
            .map((parent) => ({
              relationship: parent.relationship.trim() || null,
              fullName: parent.fullName.trim() || null,
              phoneNumber: parent.phoneNumber.trim() || null,
              isApamMember: parent.isApamMember || null,
              parentMemberCode: parent.parentMemberCode.trim() || null,
            }))
            .filter(
              (parent) =>
                parent.fullName ||
                parent.relationship ||
                parent.phoneNumber ||
                parent.isApamMember ||
                parent.parentMemberCode,
            )
        : hasKnownAge
          ? []
          : null

      const skills = formValues.skills
        .map((skill) => {
          const yearsOfExperience = Number.parseInt(skill.yearsOfExperience, 10)
          const skillCategory = resolveSkillEntryValue(skill.skillCategory, skill.skillCategoryOther)
          const skillLevel = resolveSkillEntryValue(skill.skillLevel, skill.skillLevelOther)

          return {
            skillCategory,
            skillName: skill.skillName.trim() || null,
            skillLevel,
            isCertified: skill.isCertified || null,
            yearsOfExperience: Number.isNaN(yearsOfExperience) ? null : Math.max(yearsOfExperience, 0),
          }
        })
        .filter((skill) => skill.skillCategory && skill.skillName)

      const yearsInOperation = Number.parseInt(formValues.yearsInOperation, 10)
      const numberOfEmployees = Number.parseInt(formValues.numberOfEmployees, 10)
      const personsWithAlbinismInFamily = Number.parseInt(formValues.personsWithAlbinismInFamily, 10)
      const numberOfChildrenInPreschool = Number.parseInt(formValues.numberOfChildrenInPreschool, 10)
      const numberOfChildrenInPrimarySchool = Number.parseInt(formValues.numberOfChildrenInPrimarySchool, 10)
      const numberOfChildrenInSecondarySchool = Number.parseInt(formValues.numberOfChildrenInSecondarySchool, 10)
      const programInterests = formValues.programInterests
        .map((entry) => ({
          programArea: entry.programArea,
          interested: entry.interested || null,
        }))
        .filter((entry) => entry.interested)

      const payload = {
        fullName: formValues.fullName.trim(),
        gender: formValues.gender.trim(),
        dateOfBirth: formValues.dateOfBirth ? formValues.dateOfBirth : null,
        nationalId: formValues.nationalId.trim() || null,
        phoneNumber: formValues.phoneNumber.trim() || null,
        alternativeContact: formValues.alternativeContact.trim() || null,
        district: formValues.district.trim(),
        districtOfOrigin: formValues.districtOfOrigin.trim() || null,
        traditionalAuthority: formValues.traditionalAuthority.trim() || null,
        villageArea: formValues.villageArea.trim() || null,
        isRegisteredApamMember: formValues.isRegisteredApamMember || null,
        maritalStatus: formValues.maritalStatus || null,
        isMarriedToFellowMember: formValues.isMarriedToFellowMember || null,
        spouseMemberCode: formValues.spouseMemberCode.trim() || null,
        spouseFullName: formValues.spouseFullName.trim() || null,
        spousePhoneNumber: formValues.spousePhoneNumber.trim() || null,
        personsWithAlbinismInFamily: Number.isNaN(personsWithAlbinismInFamily)
          ? null
          : Math.max(personsWithAlbinismInFamily, 0),
        numberOfChildrenInPreschool: Number.isNaN(numberOfChildrenInPreschool)
          ? null
          : Math.max(numberOfChildrenInPreschool, 0),
        numberOfChildrenInPrimarySchool: Number.isNaN(numberOfChildrenInPrimarySchool)
          ? null
          : Math.max(numberOfChildrenInPrimarySchool, 0),
        numberOfChildrenInSecondarySchool: Number.isNaN(numberOfChildrenInSecondarySchool)
          ? null
          : Math.max(numberOfChildrenInSecondarySchool, 0),
        parentContacts,
        educationLevel: formValues.educationLevel || null,
        employmentStatus: formValues.currentEmploymentStatus || formValues.employmentStatus || null,
        healthConditions: formValues.healthConditions || null,
        disabilityStatus: formValues.disabilityStatus || null,
        assistiveDevices: formValues.assistiveDevices || null,
        hasAdditionalDisability: formValues.hasAdditionalDisability || null,
        additionalDisabilityDetails: formValues.additionalDisabilityDetails || null,
        assistiveDeviceUsage: formValues.assistiveDeviceUsage || null,
        discriminationInEducationOrEmployment:
          formValues.discriminationInEducationOrEmployment || null,
        skinCancerDiagnosis: formValues.skinCancerDiagnosis || null,
        skinCancerType: formValues.skinCancerType || null,
        skinCancerStage: formValues.skinCancerStage || null,
        currentlyReceivingTreatment: formValues.currentlyReceivingTreatment || null,
        treatmentLocation: formValues.treatmentLocation || null,
        needsSupportAccessingTreatment: formValues.needsSupportAccessingTreatment || null,
        primaryCaregiver: formValues.primaryCaregiver || null,
        literacyLevel: formValues.literacyLevel || null,
        currentTraining: formValues.currentTraining || null,
        preferredLearningFormat: formValues.preferredLearningFormat || null,
        consentStatus: formValues.consentStatus || null,
        dataSharingConsent: formValues.dataSharingConsent || null,
        notes: formValues.notes || null,
        skills,
        employmentProfile: {
          currentEmploymentStatus: formValues.currentEmploymentStatus || null,
          jobTitle: formValues.jobTitle.trim() || null,
          employerSector: formValues.employerSector || null,
          monthlyIncomeRange: formValues.monthlyIncomeRange || null,
          activelySeekingWork: formValues.activelySeekingWork || null,
        },
        businessProfile: {
          currentlyRunsBusiness: formValues.currentlyRunsBusiness || null,
          typeOfBusiness: formValues.typeOfBusiness.trim() || null,
          yearsInOperation: Number.isNaN(yearsInOperation) ? null : Math.max(yearsInOperation, 0),
          numberOfEmployees: Number.isNaN(numberOfEmployees) ? null : Math.max(numberOfEmployees, 0),
        },
        trainingProfile: {
          desiredNewSkills: formValues.desiredNewSkills.trim() || null,
          preferredTrainingAreas: formValues.preferredTrainingAreas,
          preferredTrainingFormats: formValues.preferredTrainingFormats,
          trainingBarriers: formValues.trainingBarriers,
        },
        economicOpportunityProfile: {
          hasLandForFarming: formValues.hasLandForFarming || null,
          hasStartupCapital: formValues.hasStartupCapital || null,
          receivedBusinessGrantOrLoan: formValues.receivedBusinessGrantOrLoan || null,
          partOfSavingsOrCooperative: formValues.partOfSavingsOrCooperative || null,
          beneficiaryOfGovernmentOrOtherSocialSchemes:
            formValues.beneficiaryOfGovernmentOrOtherSocialSchemes || null,
        },
        programInterests,
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
      setFormValues(createEmptyForm())
      setStepIndex(0)
      await fetchMembers()
      notify.success(activeMember ? 'Member updated successfully.' : 'Member created successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save member.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const hasParentInfoForMinor =
    !isMinor || formValues.parentContacts.some((parent) => parent.fullName.trim().length > 0)

  const canSave =
    formValues.fullName.trim().length > 0 &&
    formValues.gender.trim().length > 0 &&
    formValues.district.trim().length > 0 &&
    hasParentInfoForMinor

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
              <span>Sex</span>
              <select value={formValues.gender} onChange={updateField('gender')}>
                <option value="">Select sex</option>
                <option>Female</option>
                <option>Male</option>
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
              <span>Age</span>
              <input type="text" value={memberAge ?? ''} placeholder="Auto from date of birth" disabled />
            </label>
            <label className="form-field">
              <span>National ID (optional)</span>
              <input
                type="text"
                placeholder="Enter national ID"
                value={formValues.nationalId}
                onChange={updateField('nationalId')}
              />
            </label>
            <label className="form-field">
              <span>Phone number</span>
              <input
                type="text"
                placeholder="Enter phone number"
                value={formValues.phoneNumber}
                onChange={updateField('phoneNumber')}
              />
            </label>
            <label className="form-field">
              <span>Alternative contact</span>
              <input
                type="text"
                placeholder="Alternative phone or contact"
                value={formValues.alternativeContact}
                onChange={updateField('alternativeContact')}
              />
            </label>
            <label className="form-field">
              <span>District of residence</span>
              <select value={formValues.district} onChange={updateField('district')}>
                <option value="">Select district</option>
                {MALAWI_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>District of origin</span>
              <select value={formValues.districtOfOrigin} onChange={updateField('districtOfOrigin')}>
                <option value="">Select district</option>
                {MALAWI_DISTRICTS.map((district) => (
                  <option key={`origin-${district}`} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Traditional authority</span>
              <input
                type="text"
                placeholder="Enter traditional authority"
                value={formValues.traditionalAuthority}
                onChange={updateField('traditionalAuthority')}
              />
            </label>
            <label className="form-field">
              <span>Village/Area</span>
              <input
                type="text"
                placeholder="Enter village or area"
                value={formValues.villageArea}
                onChange={updateField('villageArea')}
              />
            </label>
            <label className="form-field">
              <span>Are you a registered APAM member?</span>
              <select value={formValues.isRegisteredApamMember} onChange={updateField('isRegisteredApamMember')}>
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Marital status</span>
              <select value={formValues.maritalStatus} onChange={updateField('maritalStatus')}>
                <option value="">Select status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Separated</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </label>
            {isMarried ? (
              <label className="form-field">
                <span>Married to a fellow APAM member?</span>
                <select
                  value={formValues.isMarriedToFellowMember}
                  onChange={updateField('isMarriedToFellowMember')}
                >
                  <option value="">Select response</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
            ) : null}
            {isMarriedToFellowMember ? (
              <>
                <label className="form-field">
                  <span>Spouse member code</span>
                  <input
                    type="text"
                    placeholder="Example: BEN-00012"
                    value={formValues.spouseMemberCode}
                    onChange={updateField('spouseMemberCode')}
                  />
                </label>
                <label className="form-field">
                  <span>Spouse full name</span>
                  <input
                    type="text"
                    placeholder="Enter spouse full name"
                    value={formValues.spouseFullName}
                    onChange={updateField('spouseFullName')}
                  />
                </label>
                <label className="form-field">
                  <span>Spouse phone number</span>
                  <input
                    type="text"
                    placeholder="Enter spouse phone number"
                    value={formValues.spousePhoneNumber}
                    onChange={updateField('spousePhoneNumber')}
                  />
                </label>
              </>
            ) : null}
            <label className="form-field">
              <span>How many persons with albinism are in your family?</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter count"
                value={formValues.personsWithAlbinismInFamily}
                onChange={updateField('personsWithAlbinismInFamily')}
              />
            </label>
            {shouldShowChildrenSchoolQuestions ? (
              <>
                <label className="form-field">
                  <span>Number of children in pre-school</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={formValues.numberOfChildrenInPreschool}
                    onChange={updateField('numberOfChildrenInPreschool')}
                  />
                </label>
                <label className="form-field">
                  <span>Number of children in primary school</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={formValues.numberOfChildrenInPrimarySchool}
                    onChange={updateField('numberOfChildrenInPrimarySchool')}
                  />
                </label>
                <label className="form-field">
                  <span>Number of children in secondary school</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter count"
                    value={formValues.numberOfChildrenInSecondarySchool}
                    onChange={updateField('numberOfChildrenInSecondarySchool')}
                  />
                </label>
              </>
            ) : null}
            {isMinor ? (
              <div className="form-field form-field-full parent-section">
                <div className="parent-section-header">
                  <div>
                    <span>Parent/guardian information (required for members under 18)</span>
                    <p className="table-meta">Current age: {memberAge}</p>
                  </div>
                  {formValues.parentContacts.length < 2 ? (
                    <Button type="button" variant="outline" size="sm" onClick={addParentContact}>
                      Add second parent
                    </Button>
                  ) : null}
                </div>
                <div className="parent-grid">
                  {formValues.parentContacts.map((parent, index) => (
                    <div className="parent-card" key={`parent-contact-${index}`}>
                      <p className="parent-title">Parent/Guardian {index + 1}</p>
                      <label className="form-field">
                        <span>Relationship</span>
                        <select
                          value={parent.relationship}
                          onChange={updateParentContact(index, 'relationship')}
                        >
                          <option value="">Select relationship</option>
                          <option>Mother</option>
                          <option>Father</option>
                          <option>Guardian</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Full name</span>
                        <input
                          type="text"
                          placeholder="Enter parent/guardian full name"
                          value={parent.fullName}
                          onChange={updateParentContact(index, 'fullName')}
                        />
                      </label>
                      <label className="form-field">
                        <span>Phone number</span>
                        <input
                          type="text"
                          placeholder="Enter phone number"
                          value={parent.phoneNumber}
                          onChange={updateParentContact(index, 'phoneNumber')}
                        />
                      </label>
                      <label className="form-field">
                        <span>Is this parent an APAM member?</span>
                        <select value={parent.isApamMember} onChange={updateParentContact(index, 'isApamMember')}>
                          <option value="">Select response</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </label>
                      {parent.isApamMember === 'Yes' ? (
                        <label className="form-field">
                          <span>Parent member code</span>
                          <input
                            type="text"
                            placeholder="Example: BEN-00021"
                            value={parent.parentMemberCode}
                            onChange={updateParentContact(index, 'parentMemberCode')}
                          />
                        </label>
                      ) : null}
                      {formValues.parentContacts.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParentContact(index)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )
      case 1:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Any additional disability besides albinism?</span>
              <select
                value={formValues.hasAdditionalDisability}
                onChange={updateField('hasAdditionalDisability')}
              >
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            {formValues.hasAdditionalDisability === 'Yes' ? (
              <label className="form-field">
                <span>If yes, specify</span>
                <input
                  type="text"
                  placeholder="Enter disability details"
                  value={formValues.additionalDisabilityDetails}
                  onChange={updateField('additionalDisabilityDetails')}
                />
              </label>
            ) : null}
            <label className="form-field">
              <span>Do you use any assistive devices?</span>
              <select value={formValues.assistiveDeviceUsage} onChange={updateField('assistiveDeviceUsage')}>
                <option value="">Select response</option>
                <option>None</option>
                <option>Glasses</option>
                <option>Magnifier</option>
                <option>White cane</option>
                <option>Others</option>
              </select>
            </label>
            <label className="form-field">
              <span>Do you face discrimination in education or employment?</span>
              <select
                value={formValues.discriminationInEducationOrEmployment}
                onChange={updateField('discriminationInEducationOrEmployment')}
              >
                <option value="">Select response</option>
                <option>Often</option>
                <option>Some</option>
                <option>Never</option>
              </select>
            </label>
            <label className="form-field">
              <span>Diagnosed with skin cancer by a health professional?</span>
              <select value={formValues.skinCancerDiagnosis} onChange={updateField('skinCancerDiagnosis')}>
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
                <option>Not sure</option>
              </select>
            </label>
            {formValues.skinCancerDiagnosis === 'Yes' ? (
              <>
                <label className="form-field">
                  <span>If yes, type of skin cancer (if known)</span>
                  <select value={formValues.skinCancerType} onChange={updateField('skinCancerType')}>
                    <option value="">Select type</option>
                    <option>Squamous cell</option>
                    <option>Carcinoma</option>
                    <option>Melanoma</option>
                    <option>Other</option>
                    <option>Don't know</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Level/stage of skin cancer (if known)</span>
                  <select value={formValues.skinCancerStage} onChange={updateField('skinCancerStage')}>
                    <option value="">Select stage</option>
                    <option>Early stage</option>
                    <option>Moderate</option>
                    <option>Advanced</option>
                    <option>Recurrent</option>
                    <option>Don't know</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Are you currently receiving treatment?</span>
                  <select
                    value={formValues.currentlyReceivingTreatment}
                    onChange={updateField('currentlyReceivingTreatment')}
                  >
                    <option value="">Select response</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                {formValues.currentlyReceivingTreatment === 'Yes' ? (
                  <label className="form-field">
                    <span>If yes, where are you receiving treatment?</span>
                    <input
                      type="text"
                      placeholder="Hospital or clinic name"
                      value={formValues.treatmentLocation}
                      onChange={updateField('treatmentLocation')}
                    />
                  </label>
                ) : null}
                <label className="form-field">
                  <span>Do you need support accessing treatment?</span>
                  <select
                    value={formValues.needsSupportAccessingTreatment}
                    onChange={updateField('needsSupportAccessingTreatment')}
                  >
                    <option value="">Select response</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
              </>
            ) : null}
          </div>
        )
      case 2:
        return (
          <div className="form-grid">
            <div className="form-field form-field-full skills-section">
              <div className="skills-section-header">
                <span>Section 5A/B: Skills profile</span>
                <Button type="button" variant="outline" size="sm" onClick={addSkillEntry}>
                  Add skill
                </Button>
              </div>
              <div className="skills-grid">
                {formValues.skills.map((skill, index) => (
                  <div className="skill-card" key={`skill-entry-${index}`}>
                    <label className="form-field">
                      <span>Skill category</span>
                      <select
                        value={skill.skillCategory}
                        onChange={updateSkillEntry(index, 'skillCategory')}
                      >
                        <option value="">Select category</option>
                        {SKILL_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    {skill.skillCategory === OTHER_OPTION ? (
                      <label className="form-field">
                        <span>Specify skill category</span>
                        <input
                          type="text"
                          placeholder="Type skill category"
                          value={skill.skillCategoryOther}
                          onChange={updateSkillEntry(index, 'skillCategoryOther')}
                        />
                      </label>
                    ) : null}
                    <label className="form-field">
                      <span>Skill name</span>
                      <input
                        type="text"
                        list={`skill-options-${index}`}
                        placeholder="Enter or pick skill"
                        value={skill.skillName}
                        onChange={updateSkillEntry(index, 'skillName')}
                      />
                      <datalist id={`skill-options-${index}`}>
                        {(SKILLS_BY_CATEGORY[skill.skillCategory] ?? []).map((option) => (
                          <option key={`${skill.skillCategory}-${option}`} value={option} />
                        ))}
                      </datalist>
                    </label>
                    <label className="form-field">
                      <span>Skill level</span>
                      <select value={skill.skillLevel} onChange={updateSkillEntry(index, 'skillLevel')}>
                        <option value="">Select level</option>
                        {SKILL_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>
                    {skill.skillLevel === OTHER_OPTION ? (
                      <label className="form-field">
                        <span>Specify skill level</span>
                        <input
                          type="text"
                          placeholder="Type skill level"
                          value={skill.skillLevelOther}
                          onChange={updateSkillEntry(index, 'skillLevelOther')}
                        />
                      </label>
                    ) : null}
                    <label className="form-field">
                      <span>Certified in this skill?</span>
                      <select value={skill.isCertified} onChange={updateSkillEntry(index, 'isCertified')}>
                        <option value="">Select response</option>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Years of experience</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={skill.yearsOfExperience}
                        onChange={updateSkillEntry(index, 'yearsOfExperience')}
                      />
                    </label>
                    {formValues.skills.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkillEntry(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <label className="form-field">
              <span>Do you currently run a business?</span>
              <select value={formValues.currentlyRunsBusiness} onChange={updateField('currentlyRunsBusiness')}>
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            {isRunningBusiness ? (
              <>
                <label className="form-field">
                  <span>Type of business</span>
                  <input
                    type="text"
                    placeholder="Enter business type"
                    value={formValues.typeOfBusiness}
                    onChange={updateField('typeOfBusiness')}
                  />
                </label>
                <label className="form-field">
                  <span>Years in operation</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formValues.yearsInOperation}
                    onChange={updateField('yearsInOperation')}
                  />
                </label>
                <label className="form-field">
                  <span>Number of employees (if any)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formValues.numberOfEmployees}
                    onChange={updateField('numberOfEmployees')}
                  />
                </label>
              </>
            ) : null}
          </div>
        )
      case 3:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Current employment status</span>
              <select
                value={formValues.currentEmploymentStatus}
                onChange={updateField('currentEmploymentStatus')}
              >
                <option value="">Select status</option>
                {EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            {isEmployedOrSelfEmployed ? (
              <>
                <label className="form-field">
                  <span>Job title</span>
                  <input
                    type="text"
                    placeholder="Enter job title"
                    value={formValues.jobTitle}
                    onChange={updateField('jobTitle')}
                  />
                </label>
                <label className="form-field">
                  <span>Employer/sector</span>
                  <select value={formValues.employerSector} onChange={updateField('employerSector')}>
                    <option value="">Select sector</option>
                    {EMPLOYER_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Monthly income range</span>
                  <select
                    value={formValues.monthlyIncomeRange}
                    onChange={updateField('monthlyIncomeRange')}
                  >
                    <option value="">Select range</option>
                    {MONTHLY_INCOME_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            {isUnemployed ? (
              <label className="form-field">
                <span>Actively seeking work?</span>
                <select value={formValues.activelySeekingWork} onChange={updateField('activelySeekingWork')}>
                  <option value="">Select response</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
            ) : null}
            <label className="form-field">
              <span>Highest education level</span>
              <select value={formValues.educationLevel} onChange={updateField('educationLevel')}>
                <option value="">Select level</option>
                <option>Primary</option>
                <option>Secondary</option>
                <option>Certificate</option>
                <option>Diploma</option>
                <option>University</option>
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
          </div>
        )
      case 4:
        return (
          <div className="form-grid">
            <label className="form-field form-field-full">
              <span>What new skills would you like to learn?</span>
              <textarea
                rows="3"
                placeholder="Enter desired new skills"
                value={formValues.desiredNewSkills}
                onChange={updateField('desiredNewSkills')}
              />
            </label>
            <div className="form-field form-field-full">
              <span>Preferred training area</span>
              <div className="checkbox-group">
                {TRAINING_AREAS.map((area) => (
                  <label className="checkbox-option" key={area}>
                    <input
                      type="checkbox"
                      checked={formValues.preferredTrainingAreas.includes(area)}
                      onChange={toggleTrainingSelection('preferredTrainingAreas', area)}
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-field form-field-full">
              <span>Preferred training format</span>
              <div className="checkbox-group">
                {TRAINING_FORMATS.map((format) => (
                  <label className="checkbox-option" key={format}>
                    <input
                      type="checkbox"
                      checked={formValues.preferredTrainingFormats.includes(format)}
                      onChange={toggleTrainingSelection('preferredTrainingFormats', format)}
                    />
                    <span>{format}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-field form-field-full">
              <span>Barriers to attending training</span>
              <div className="checkbox-group">
                {TRAINING_BARRIERS.map((barrier) => (
                  <label className="checkbox-option" key={barrier}>
                    <input
                      type="checkbox"
                      checked={formValues.trainingBarriers.includes(barrier)}
                      onChange={toggleTrainingSelection('trainingBarriers', barrier)}
                    />
                    <span>{barrier}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="form-grid">
            <label className="form-field">
              <span>Do you have land for farming?</span>
              <select value={formValues.hasLandForFarming} onChange={updateField('hasLandForFarming')}>
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Do you have access to startup capital?</span>
              <select value={formValues.hasStartupCapital} onChange={updateField('hasStartupCapital')}>
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Have you ever received a business grant/loan?</span>
              <select
                value={formValues.receivedBusinessGrantOrLoan}
                onChange={updateField('receivedBusinessGrantOrLoan')}
              >
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Are you part of a savings or cooperative group?</span>
              <select
                value={formValues.partOfSavingsOrCooperative}
                onChange={updateField('partOfSavingsOrCooperative')}
              >
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label className="form-field">
              <span>Have you ever been beneficiary of government or other social schemes?</span>
              <select
                value={formValues.beneficiaryOfGovernmentOrOtherSocialSchemes}
                onChange={updateField('beneficiaryOfGovernmentOrOtherSocialSchemes')}
              >
                <option value="">Select response</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          </div>
        )
      case 6:
        return (
          <div className="form-grid">
            {formValues.programInterests.map((entry) => (
              <label className="form-field" key={entry.programArea}>
                <span>{entry.programArea}</span>
                <select value={entry.interested} onChange={updateProgramInterest(entry.programArea)}>
                  <option value="">Select response</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
            ))}
          </div>
        )
      case 7:
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
          <Button variant="outline" onClick={openExportModal}>
            Export
          </Button>
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
          <select value={filterTypePickerValue} onChange={handleFilterTypeSelection}>
            <option value="">Add filter type</option>
            {availableFilterTypes.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          {activeFilterTypes.map((filterType) => {
            const filterConfig = FILTER_TYPE_OPTIONS.find((option) => option.key === filterType)
            const options = filterValueOptions[filterType] ?? []

            return (
              <div className="active-filter" key={filterType}>
                <span>{filterConfig?.label ?? filterType}</span>
                <select
                  value={filters[filterType]}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, [filterType]: event.target.value }))
                  }
                >
                  <option value="All">All</option>
                  {options.map((option) => (
                    <option key={`${filterType}-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeFilterType(filterType)
                  }}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
        {isLoading ? (
          <p className="table-meta">Loading members...</p>
        ) : (
          <DataTable columns={columns} rows={sortedRows} />
        )}
      </Card>

      <Modal
        open={isExportModalOpen}
        title="Export members"
        subtitle={`Export ${exportRows.length} record${exportRows.length === 1 ? '' : 's'}`}
        onClose={closeExportModal}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={closeExportModal}>
              Cancel
            </Button>
            <Button onClick={handleExportMembers}>Export</Button>
          </div>
        }
      >
        {exportError ? <p className="alert">{exportError}</p> : null}
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>Choose export format</span>
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
              {EXPORT_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="table-meta">
            PDF export opens the print dialog. Select "Save as PDF" to download the file.
          </p>
        </div>
      </Modal>

      <Modal
        open={isModalOpen}
        title={activeMember ? 'Edit member' : 'Add member'}
        subtitle="Complete the section-based intake form"
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

      <Modal
        open={Boolean(profileMember)}
        title={profileMember ? `${profileMember.fullName} profile` : 'Member profile'}
        subtitle={profileMember ? `${profileMember.memberCode} | ${profileMember.district}` : ''}
        onClose={closeProfileModal}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={closeProfileModal}>
              Close
            </Button>
            <Button variant="outline" onClick={handleEditFromProfile}>
              Edit profile
            </Button>
          </div>
        }
      >
        {profileMember ? (
          <div className="form-grid">
            <div className="form-field">
              <span>Sex</span>
              <strong>{toDisplayValue(profileMember.gender)}</strong>
            </div>
            <div className="form-field">
              <span>Age</span>
              <strong>{toDisplayValue(profileMember.age)}</strong>
            </div>
            <div className="form-field">
              <span>Date of birth</span>
              <strong>{toDisplayValue(formatDateForInput(profileMember.dateOfBirth))}</strong>
            </div>
            <div className="form-field">
              <span>Phone number</span>
              <strong>{toDisplayValue(profileMember.phoneNumber)}</strong>
            </div>
            <div className="form-field">
              <span>Alternative contact</span>
              <strong>{toDisplayValue(profileMember.alternativeContact)}</strong>
            </div>
            <div className="form-field">
              <span>District of origin</span>
              <strong>{toDisplayValue(profileMember.districtOfOrigin)}</strong>
            </div>
            <div className="form-field">
              <span>Traditional authority</span>
              <strong>{toDisplayValue(profileMember.traditionalAuthority)}</strong>
            </div>
            <div className="form-field">
              <span>Village/Area</span>
              <strong>{toDisplayValue(profileMember.villageArea)}</strong>
            </div>
            <div className="form-field">
              <span>APAM member</span>
              <strong>{toDisplayValue(profileMember.isRegisteredApamMember)}</strong>
            </div>
            <div className="form-field">
              <span>Marital status</span>
              <strong>{toDisplayValue(profileMember.maritalStatus)}</strong>
            </div>
            <div className="form-field">
              <span>Persons with albinism in family</span>
              <strong>{toDisplayValue(profileMember.personsWithAlbinismInFamily)}</strong>
            </div>
            <div className="form-field">
              <span>Children in pre-school</span>
              <strong>{toDisplayValue(profileMember.numberOfChildrenInPreschool)}</strong>
            </div>
            <div className="form-field">
              <span>Children in primary school</span>
              <strong>{toDisplayValue(profileMember.numberOfChildrenInPrimarySchool)}</strong>
            </div>
            <div className="form-field">
              <span>Children in secondary school</span>
              <strong>{toDisplayValue(profileMember.numberOfChildrenInSecondarySchool)}</strong>
            </div>
            <div className="form-field">
              <span>Employment status</span>
              <strong>{toDisplayValue(profileMember.employmentStatus)}</strong>
            </div>
            <div className="form-field form-field-full">
              <span>Skills</span>
              <strong>
                {toDisplayList(
                  (profileMember.skills ?? []).map(
                    (skill) =>
                      `${toDisplayValue(skill.skillName)} (${toDisplayValue(skill.skillLevel)}, ${toDisplayValue(
                        skill.skillCategory,
                      )})`,
                  ),
                )}
              </strong>
            </div>
            <div className="form-field">
              <span>Current employment status</span>
              <strong>{toDisplayValue(profileMember.employmentProfile?.currentEmploymentStatus)}</strong>
            </div>
            <div className="form-field">
              <span>Job title</span>
              <strong>{toDisplayValue(profileMember.employmentProfile?.jobTitle)}</strong>
            </div>
            <div className="form-field">
              <span>Employer sector</span>
              <strong>{toDisplayValue(profileMember.employmentProfile?.employerSector)}</strong>
            </div>
            <div className="form-field">
              <span>Monthly income range</span>
              <strong>{toDisplayValue(profileMember.employmentProfile?.monthlyIncomeRange)}</strong>
            </div>
            <div className="form-field">
              <span>Actively seeking work</span>
              <strong>{toDisplayValue(profileMember.employmentProfile?.activelySeekingWork)}</strong>
            </div>
            <div className="form-field">
              <span>Runs business</span>
              <strong>{toDisplayValue(profileMember.businessProfile?.currentlyRunsBusiness)}</strong>
            </div>
            <div className="form-field">
              <span>Business type</span>
              <strong>{toDisplayValue(profileMember.businessProfile?.typeOfBusiness)}</strong>
            </div>
            <div className="form-field">
              <span>Years in operation</span>
              <strong>{toDisplayValue(profileMember.businessProfile?.yearsInOperation)}</strong>
            </div>
            <div className="form-field">
              <span>Number of employees</span>
              <strong>{toDisplayValue(profileMember.businessProfile?.numberOfEmployees)}</strong>
            </div>
            <div className="form-field form-field-full">
              <span>Desired new skills</span>
              <strong>{toDisplayValue(profileMember.trainingProfile?.desiredNewSkills)}</strong>
            </div>
            <div className="form-field form-field-full">
              <span>Preferred training areas</span>
              <strong>{toDisplayList(profileMember.trainingProfile?.preferredTrainingAreas)}</strong>
            </div>
            <div className="form-field form-field-full">
              <span>Preferred training formats</span>
              <strong>{toDisplayList(profileMember.trainingProfile?.preferredTrainingFormats)}</strong>
            </div>
            <div className="form-field form-field-full">
              <span>Training barriers</span>
              <strong>{toDisplayList(profileMember.trainingProfile?.trainingBarriers)}</strong>
            </div>
            <div className="form-field">
              <span>Land for farming</span>
              <strong>{toDisplayValue(profileMember.economicOpportunityProfile?.hasLandForFarming)}</strong>
            </div>
            <div className="form-field">
              <span>Startup capital</span>
              <strong>{toDisplayValue(profileMember.economicOpportunityProfile?.hasStartupCapital)}</strong>
            </div>
            <div className="form-field">
              <span>Received grant/loan</span>
              <strong>
                {toDisplayValue(profileMember.economicOpportunityProfile?.receivedBusinessGrantOrLoan)}
              </strong>
            </div>
            <div className="form-field">
              <span>Savings/cooperative</span>
              <strong>
                {toDisplayValue(profileMember.economicOpportunityProfile?.partOfSavingsOrCooperative)}
              </strong>
            </div>
            <div className="form-field">
              <span>Beneficiary of government/other social schemes</span>
              <strong>
                {toDisplayValue(
                  profileMember.economicOpportunityProfile?.beneficiaryOfGovernmentOrOtherSocialSchemes,
                )}
              </strong>
            </div>
            <div className="form-field form-field-full">
              <span>Program participation interests</span>
              <strong>
                {toDisplayList(
                  (profileMember.programInterests ?? []).map(
                    (interest) => `${interest.programArea}: ${toDisplayValue(interest.interested)}`,
                  ),
                )}
              </strong>
            </div>
            <div className="form-field form-field-full">
              <span>Notes</span>
              <strong>{toDisplayValue(profileMember.notes)}</strong>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
