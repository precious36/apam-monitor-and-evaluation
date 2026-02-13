import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const users = [
  {
    id: 1,
    name: 'Grace Wanjiku',
    role: 'Enumerator',
    district: 'North',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Daniel Otieno',
    role: 'Supervisor',
    district: 'Central',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Sarah Kimani',
    role: 'Admin',
    district: 'National',
    status: 'Active',
  },
]

export default function UsersSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <select defaultValue={row.role} className="inline-select">
          <option>Enumerator</option>
          <option>Supervisor</option>
          <option>Admin</option>
        </select>
      ),
    },
    { key: 'district', label: 'District' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="table-actions">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="outline" size="sm">
            Deactivate
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Users and settings</p>
          <h1 className="page-title">Users and Roles</h1>
          <p className="page-subtitle">Manage enumerators, supervisors, and administrators.</p>
        </div>
        <div className="page-actions">
          <Button
            onClick={() => {
              setIsModalOpen(true)
            }}
          >
            Add user
          </Button>
        </div>
      </div>

      <Card className="reveal">
        <DataTable columns={columns} rows={users} />
      </Card>

      <Modal
        open={isModalOpen}
        title="Add user"
        subtitle="Create a new account and assign a role"
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button>Create user</Button>
          </div>
        }
      >
        <div className="form-grid">
          <label className="form-field">
            <span>Full name</span>
            <input type="text" placeholder="Enter full name" />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input type="email" placeholder="name@agency.org" />
          </label>
          <label className="form-field">
            <span>Role</span>
            <select>
              <option>Enumerator</option>
              <option>Supervisor</option>
              <option>Admin</option>
            </select>
          </label>
          <label className="form-field">
            <span>District</span>
            <select>
              <option>North</option>
              <option>Central</option>
              <option>South</option>
              <option>National</option>
            </select>
          </label>
        </div>
      </Modal>
    </div>
  )
}
