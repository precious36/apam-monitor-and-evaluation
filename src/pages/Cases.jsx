import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusPill from '../components/StatusPill'

const cases = [
  {
    id: 'CASE-2043',
    member: 'Amina Noor',
    memberId: 'BEN-00124',
    type: 'GBV',
    district: 'North',
    date: 'Jan 22, 2026',
    status: 'Critical',
    officer: 'Lydia Mwangi',
  },
  {
    id: 'CASE-2044',
    member: 'Peter Odhiambo',
    memberId: 'BEN-00125',
    type: 'Child protection',
    district: 'Central',
    date: 'Jan 26, 2026',
    status: 'Ongoing',
    officer: 'Ahmed Ali',
  },
  {
    id: 'CASE-2045',
    member: 'Mariam Issa',
    memberId: 'BEN-00126',
    type: 'Labor',
    district: 'South',
    date: 'Jan 28, 2026',
    status: 'Closed',
    officer: 'Judith Leka',
  },
]

export default function Cases() {
  const [selected, setSelected] = useState(cases[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)

  const columns = [
    { key: 'id', label: 'Case ID' },
    { key: 'member', label: 'Member' },
    { key: 'type', label: 'Type' },
    { key: 'district', label: 'District' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill value={row.status} />,
    },
    { key: 'officer', label: 'Officer' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Case management</p>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Track incidents, actions, and resolution timelines.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline">Export list</Button>
          <Button onClick={() => setIsNewCaseOpen(true)}>New case</Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Active cases" subtitle="Open this month">
          <div className="metric-value">126</div>
          <p className="metric-meta">12 require urgent action</p>
        </Card>
        <Card className="metric-card reveal" title="Critical" subtitle="High priority">
          <div className="metric-value">12</div>
          <p className="metric-meta">Average response 1.2 days</p>
        </Card>
        <Card className="metric-card reveal" title="Ongoing" subtitle="In progress">
          <div className="metric-value">68</div>
          <p className="metric-meta">Multi-agency coordination</p>
        </Card>
        <Card className="metric-card reveal" title="Closed" subtitle="Resolved cases">
          <div className="metric-value">46</div>
          <p className="metric-meta">Follow-up visits scheduled</p>
        </Card>
      </section>

      <div className="cases-layout">
        <Card className="reveal">
          <div className="filters-row">
            <input type="search" placeholder="Search by case ID" />
            <select>
              <option>All types</option>
              <option>GBV</option>
              <option>Child protection</option>
              <option>Labor</option>
            </select>
            <select>
              <option>All statuses</option>
              <option>Critical</option>
              <option>Ongoing</option>
              <option>Closed</option>
            </select>
          </div>
          <DataTable columns={columns} rows={cases} onRowClick={setSelected} />
        </Card>

        <Card title="Case detail" subtitle="Incident and response summary" className="reveal">
          <div className="case-detail">
            <div>
              <p className="info-label">Incident information</p>
              <p className="info-value">{selected.type} reported in {selected.district} district.</p>
              <p className="info-meta">
                {selected.id} · Reported on {selected.date} · Assigned to {selected.officer}
              </p>
            </div>
            <div className="info-grid">
              <div>
                <p className="info-label">Location</p>
                <p className="info-value">{selected.district} district</p>
              </div>
              <div>
                <p className="info-label">Case type</p>
                <p className="info-value">{selected.type}</p>
              </div>
              <div>
                <p className="info-label">Lead officer</p>
                <p className="info-value">{selected.officer}</p>
              </div>
              <div>
                <p className="info-label">Member</p>
                <p className="info-value">{selected.member}</p>
              </div>
              <div>
                <p className="info-label">Status</p>
                <StatusPill value={selected.status} />
              </div>
            </div>
            <div>
              <p className="info-label">Member information</p>
              <ul className="detail-list">
                <li>Name: {selected.member}</li>
                <li>Member ID: {selected.memberId}</li>
                <li>Referral: Medical and legal support</li>
              </ul>
            </div>
            <div>
              <p className="info-label">Suspects</p>
              <ul className="detail-list">
                <li>2 known individuals</li>
                <li>Police report filed</li>
              </ul>
            </div>
            <div>
              <p className="info-label">Timeline and status updates</p>
              <ul className="timeline">
                <li>
                  <span>Jan 22, 2026</span>
                  <p>Case opened and survivor safety plan activated.</p>
                </li>
                <li>
                  <span>Jan 24, 2026</span>
                  <p>Medical referral completed and follow-up scheduled.</p>
                </li>
                <li>
                  <span>Jan 30, 2026</span>
                  <p>Legal aid consultation conducted.</p>
                </li>
              </ul>
            </div>
            <div className="case-detail-actions">
              <StatusPill value={selected.status} />
              <Button onClick={() => setIsModalOpen(true)}>Update case status</Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={isModalOpen}
        title="Update case status"
        subtitle="Record the latest status update"
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button>Save update</Button>
          </div>
        }
      >
        <div className="form-grid">
          <label className="form-field">
            <span>New status</span>
            <select>
              <option>Critical</option>
              <option>Ongoing</option>
              <option>Closed</option>
            </select>
          </label>
          <label className="form-field form-field-full">
            <span>Status notes</span>
            <textarea rows="4" placeholder="Describe the update" />
          </label>
        </div>
      </Modal>

      <Modal
        open={isNewCaseOpen}
        title="Create new case"
        subtitle="Capture member and incident details"
        onClose={() => setIsNewCaseOpen(false)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsNewCaseOpen(false)}>
              Cancel
            </Button>
            <Button>Create case</Button>
          </div>
        }
      >
        <div className="form-grid">
          <label className="form-field">
            <span>Member</span>
            <select>
              <option>Amina Noor (BEN-00124)</option>
              <option>Peter Odhiambo (BEN-00125)</option>
              <option>Mariam Issa (BEN-00126)</option>
            </select>
          </label>
          <label className="form-field">
            <span>Case type</span>
            <select>
              <option>GBV</option>
              <option>Child protection</option>
              <option>Labor</option>
              <option>Health referral</option>
            </select>
          </label>
          <label className="form-field">
            <span>District</span>
            <select>
              <option>North</option>
              <option>Central</option>
              <option>South</option>
            </select>
          </label>
          <label className="form-field">
            <span>Date reported</span>
            <input type="date" />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select>
              <option>Critical</option>
              <option>Ongoing</option>
              <option>Closed</option>
            </select>
          </label>
          <label className="form-field">
            <span>Assigned officer</span>
            <input type="text" placeholder="Officer name" />
          </label>
          <label className="form-field form-field-full">
            <span>Incident summary</span>
            <textarea rows="4" placeholder="Brief description of the case" />
          </label>
        </div>
      </Modal>
    </div>
  )
}
