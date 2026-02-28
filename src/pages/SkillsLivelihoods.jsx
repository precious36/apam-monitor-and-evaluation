import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'

const tabs = [
  { id: 'skills', label: 'Skills' },
  { id: 'employment', label: 'Employment' },
  { id: 'training', label: 'Training needs' },
  { id: 'support', label: 'Economic support' },
]

const skills = [
  {
    id: 1,
    skill: 'Tailoring',
    level: 'Advanced',
    experience: '6 years',
    certification: 'Yes',
  },
  {
    id: 2,
    skill: 'Hospitality',
    level: 'Intermediate',
    experience: '3 years',
    certification: 'No',
  },
  {
    id: 3,
    skill: 'Digital literacy',
    level: 'Basic',
    experience: '1 year',
    certification: 'Yes',
  },
]

export default function SkillsLivelihoods() {
  const [activeTab, setActiveTab] = useState('skills')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false)

  const columns = [
    { key: 'skill', label: 'Skill' },
    { key: 'level', label: 'Level' },
    { key: 'experience', label: 'Years of experience' },
    { key: 'certification', label: 'Certification' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSkill(row)}>
            View
          </Button>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Member profile</p>
          <h1 className="page-title">Skills and Livelihoods</h1>
          <p className="page-subtitle">Personalized skills and economic support overview.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline">Export profile</Button>
          <Button>Update record</Button>
        </div>
      </div>

      <Card className="profile-card reveal">
        <div className="profile-grid">
          <div>
            <p className="profile-label">Member</p>
            <h2 className="profile-name">Amina Noor</h2>
            <p className="profile-meta">ID BEN-00124 | District North</p>
          </div>
          <div className="profile-info">
            <div>
              <p className="profile-label">Age</p>
              <p className="profile-value">28</p>
            </div>
            <div>
              <p className="profile-label">Employment status</p>
              <p className="profile-value">Unemployed</p>
            </div>
            <div>
              <p className="profile-label">Last assessment</p>
              <p className="profile-value">Jan 18, 2026</p>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'skills' && (
        <Card
          title="Skills inventory"
          subtitle="Current skills, experience, and certification"
          action={<Button onClick={() => setIsAddSkillModalOpen(true)}>Add skill</Button>}
          className="reveal"
        >
          <DataTable columns={columns} rows={skills} />
        </Card>
      )}

      {activeTab === 'employment' && (
        <Card title="Employment details" subtitle="Current job placement" className="reveal">
          <div className="info-grid">
            <div>
              <p className="info-label">Current role</p>
              <p className="info-value">Not employed</p>
            </div>
            <div>
              <p className="info-label">Preferred sector</p>
              <p className="info-value">Hospitality</p>
            </div>
            <div>
              <p className="info-label">Income range</p>
              <p className="info-value">Below 50,000</p>
            </div>
            <div>
              <p className="info-label">Placement readiness</p>
              <p className="info-value">Requires coaching</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'training' && (
        <Card title="Training needs" subtitle="Preferred skills and barriers" className="reveal">
          <div className="tag-grid">
            <div>
              <p className="info-label">Preferred skills</p>
              <div className="tag-list">
                <span className="tag">Hospitality</span>
                <span className="tag">Food processing</span>
                <span className="tag">Digital literacy</span>
              </div>
            </div>
            <div>
              <p className="info-label">Barriers</p>
              <div className="tag-list">
                <span className="tag tag-muted">Transport</span>
                <span className="tag tag-muted">Childcare</span>
                <span className="tag tag-muted">Tuition fees</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'support' && (
        <Card title="Economic support" subtitle="Grants and support services" className="reveal">
          <div className="support-grid">
            <div className="support-item">
              <p className="support-title">Small business grant</p>
              <p className="support-value">Approved - 120,000</p>
              <p className="support-meta">Disbursement scheduled in March</p>
            </div>
            <div className="support-item">
              <p className="support-title">Land access</p>
              <p className="support-value">Pending verification</p>
              <p className="support-meta">Plot assignment under review</p>
            </div>
            <div className="support-item">
              <p className="support-title">Savings group</p>
              <p className="support-value">North Women Cooperative</p>
              <p className="support-meta">Weekly contributions ongoing</p>
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(selectedSkill)}
        title={selectedSkill ? `${selectedSkill.skill} details` : 'Skill details'}
        subtitle="Skill record summary"
        onClose={() => setSelectedSkill(null)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setSelectedSkill(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSkill ? (
          <div className="form-grid">
            <div className="form-field">
              <span>Skill name</span>
              <strong>{selectedSkill.skill}</strong>
            </div>
            <div className="form-field">
              <span>Skill level</span>
              <strong>{selectedSkill.level}</strong>
            </div>
            <div className="form-field">
              <span>Years of experience</span>
              <strong>{selectedSkill.experience}</strong>
            </div>
            <div className="form-field">
              <span>Certification</span>
              <strong>{selectedSkill.certification}</strong>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isAddSkillModalOpen}
        title="Add skill"
        subtitle="Capture skill level and certification"
        onClose={() => setIsAddSkillModalOpen(false)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsAddSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button>Save skill</Button>
          </div>
        }
      >
        <div className="form-grid">
          <label className="form-field">
            <span>Skill name</span>
            <input type="text" placeholder="Enter skill name" />
          </label>
          <label className="form-field">
            <span>Skill level</span>
            <select>
              <option>Basic</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="form-field">
            <span>Years of experience</span>
            <input type="number" placeholder="0" />
          </label>
          <label className="form-field">
            <span>Certification</span>
            <select>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>
        </div>
      </Modal>
    </div>
  )
}
