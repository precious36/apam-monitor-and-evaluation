import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const LOCKOUT_MINUTES = 30
const MIN_ROLE_NAME_LENGTH = 2
const MANAGEMENT_TABS = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
]

const createEmptyForm = () => ({
  email: '',
  userName: '',
  password: '',
  phoneNumber: '',
  emailConfirmed: false,
  twoFactorEnabled: false,
  lockoutEnabled: true,
  roles: [],
})

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

const isUserLocked = (user) => {
  if (!user?.lockoutEnd) {
    return false
  }

  const lockoutEnd = new Date(user.lockoutEnd)
  return !Number.isNaN(lockoutEnd.getTime()) && lockoutEnd.getTime() > Date.now()
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

export default function UsersSettings({ session }) {
  const notify = useNotify()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingActionUserId, setPendingActionUserId] = useState('')
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeManagementTab, setActiveManagementTab] = useState('users')
  const [newRoleName, setNewRoleName] = useState('')
  const [isRoleSaving, setIsRoleSaving] = useState(false)
  const [pendingRoleName, setPendingRoleName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [activeUser, setActiveUser] = useState(null)
  const [formValues, setFormValues] = useState(() => createEmptyForm())

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const fetchUsers = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: authHeader,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load users.'))
    }

    return payload.data ?? []
  }, [authHeader])

  const fetchRoles = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      headers: authHeader,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load roles.'))
    }

    const roleNames = (payload.data ?? [])
      .map((role) => role.name)
      .filter((roleName) => typeof roleName === 'string' && roleName.trim().length > 0)
      .sort((a, b) => a.localeCompare(b))

    return roleNames
  }, [authHeader])

  const loadUsersAndRoles = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const [usersPayload, rolesPayload] = await Promise.all([fetchUsers(), fetchRoles()])
      setUsers(usersPayload)
      setRoles(rolesPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user management data.'
      setPageError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fetchRoles, fetchUsers, notify])

  useEffect(() => {
    loadUsersAndRoles()
  }, [loadUsersAndRoles])

  useEffect(() => {
    setFormValues((prev) => {
      if (!prev.roles.length) {
        return prev
      }

      const filteredRoles = prev.roles.filter((role) => roles.includes(role))
      if (filteredRoles.length === prev.roles.length) {
        return prev
      }

      return {
        ...prev,
        roles: filteredRoles,
      }
    })
  }, [roles])

  const openCreateModal = useCallback(() => {
    setFormMode('create')
    setActiveUser(null)
    setSaveError('')
    setFormValues(createEmptyForm())
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((user) => {
    setFormMode('edit')
    setActiveUser(user)
    setSaveError('')
    setFormValues({
      email: user.email ?? '',
      userName: user.userName ?? '',
      password: '',
      phoneNumber: user.phoneNumber ?? '',
      emailConfirmed: Boolean(user.emailConfirmed),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      lockoutEnabled: Boolean(user.lockoutEnabled),
      roles: Array.isArray(user.roles) ? user.roles : [],
    })
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback((options = {}) => {
    const force = Boolean(options?.force)
    if (isSaving && !force) {
      return
    }

    setIsModalOpen(false)
    setActiveUser(null)
    setSaveError('')
    setFormValues(createEmptyForm())
  }, [isSaving])

  const updateField = (field) => (event) => {
    const { value, type, checked } = event.target
    setFormValues((prev) => ({
      ...prev,
      [field]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleRole = (roleName) => () => {
    setFormValues((prev) => {
      const hasRole = prev.roles.includes(roleName)
      return {
        ...prev,
        roles: hasRole ? prev.roles.filter((role) => role !== roleName) : [...prev.roles, roleName],
      }
    })
  }

  const handleSaveUser = useCallback(async () => {
    const email = formValues.email.trim()
    if (!email) {
      const errorMessage = 'Email is required.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    if (formMode === 'create' && formValues.password.trim().length < 8) {
      const errorMessage = 'Password must be at least 8 characters.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    if (formValues.roles.length === 0) {
      const errorMessage = 'Select at least one role.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      if (formMode === 'create') {
        const createResponse = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            email,
            userName: formValues.userName.trim() || null,
            password: formValues.password,
            phoneNumber: formValues.phoneNumber.trim() || null,
            emailConfirmed: formValues.emailConfirmed,
            roles: formValues.roles,
          }),
        })

        const createPayload = await createResponse.json().catch(() => null)
        if (!createResponse.ok || !createPayload?.succeeded || !createPayload?.data?.userId) {
          throw new Error(getApiErrorMessage(createPayload, createResponse.status, 'Failed to create user.'))
        }
      } else {
        const userId = activeUser?.userId
        if (!userId) {
          throw new Error('Unable to determine selected user.')
        }

        const updateResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            email,
            userName: formValues.userName.trim() || null,
            phoneNumber: formValues.phoneNumber.trim() || null,
            emailConfirmed: formValues.emailConfirmed,
            twoFactorEnabled: formValues.twoFactorEnabled,
            lockoutEnabled: formValues.lockoutEnabled,
          }),
        })

        const updatePayload = await updateResponse.json().catch(() => null)
        if (!updateResponse.ok || !updatePayload?.succeeded) {
          throw new Error(getApiErrorMessage(updatePayload, updateResponse.status, 'Failed to update user.'))
        }

        const assignRolesResponse = await fetch(`${API_BASE_URL}/api/users/${userId}/roles`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            roles: formValues.roles,
          }),
        })

        const assignRolesPayload = await assignRolesResponse.json().catch(() => null)
        if (!assignRolesResponse.ok || !assignRolesPayload?.succeeded) {
          throw new Error(
            getApiErrorMessage(assignRolesPayload, assignRolesResponse.status, 'Failed to update user roles.'),
          )
        }
      }

      await loadUsersAndRoles()
      closeModal({ force: true })
      notify.success(formMode === 'create' ? 'User created successfully.' : 'User updated successfully.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user.'
      setSaveError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [activeUser?.userId, authHeader, closeModal, formMode, formValues, loadUsersAndRoles, notify])

  const handleLockToggle = useCallback(async (user) => {
    const userId = user?.userId
    if (!userId) {
      return
    }

    const shouldLock = !isUserLocked(user)
    setPendingActionUserId(userId)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/lock-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          isLocked: shouldLock,
          lockoutMinutes: LOCKOUT_MINUTES,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.succeeded) {
        throw new Error(
          getApiErrorMessage(payload, response.status, shouldLock ? 'Failed to lock user.' : 'Failed to unlock user.'),
        )
      }

      await loadUsersAndRoles()
      notify.success(shouldLock ? 'User locked successfully.' : 'User unlocked successfully.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to update lock status.')
    } finally {
      setPendingActionUserId('')
    }
  }, [authHeader, loadUsersAndRoles, notify])

  const handleDeleteUser = useCallback(async (user) => {
    const userId = user?.userId
    const userLabel = user?.userName || user?.email || 'this user'
    if (!userId) {
      return
    }

    if (!window.confirm(`Delete ${userLabel}? This action cannot be undone.`)) {
      return
    }

    setPendingActionUserId(userId)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (response.status !== 204) {
        const payload = await response.json().catch(() => null)
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to delete user.'))
      }

      await loadUsersAndRoles()
      notify.success('User deleted successfully.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to delete user.')
    } finally {
      setPendingActionUserId('')
    }
  }, [authHeader, loadUsersAndRoles, notify])

  const handleCreateRole = useCallback(async () => {
    const roleName = newRoleName.trim()
    if (roleName.length < MIN_ROLE_NAME_LENGTH) {
      notify.error(`Role name must be at least ${MIN_ROLE_NAME_LENGTH} characters.`)
      return
    }

    const roleExists = roles.some((role) => role.toLowerCase() === roleName.toLowerCase())
    if (roleExists) {
      notify.error('Role already exists.')
      return
    }

    setIsRoleSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          roleName,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.succeeded) {
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to create role.'))
      }

      await loadUsersAndRoles()
      setNewRoleName('')
      notify.success('Role created successfully.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to create role.')
    } finally {
      setIsRoleSaving(false)
    }
  }, [authHeader, loadUsersAndRoles, newRoleName, notify, roles])

  const handleDeleteRole = useCallback(async (roleName) => {
    const normalizedRoleName = String(roleName ?? '').trim()
    if (!normalizedRoleName) {
      return
    }

    const assignedUsersCount = users.filter((user) => (user.roles ?? []).includes(normalizedRoleName)).length
    if (assignedUsersCount > 0) {
      notify.error(`Remove "${normalizedRoleName}" from users before deleting it.`)
      return
    }

    if (!window.confirm(`Delete role "${normalizedRoleName}"? This action cannot be undone.`)) {
      return
    }

    setIsRoleSaving(true)
    setPendingRoleName(normalizedRoleName)

    try {
      const response = await fetch(`${API_BASE_URL}/api/roles/${encodeURIComponent(normalizedRoleName)}`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (response.status !== 204) {
        const payload = await response.json().catch(() => null)
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to delete role.'))
      }

      await loadUsersAndRoles()
      setRoleFilter((currentFilter) => (currentFilter === normalizedRoleName ? 'All' : currentFilter))
      notify.success('Role deleted successfully.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to delete role.')
    } finally {
      setPendingRoleName('')
      setIsRoleSaving(false)
    }
  }, [authHeader, loadUsersAndRoles, notify, users])

  const roleFilterOptions = useMemo(() => ['All', ...roles], [roles])

  const filteredUsers = useMemo(() => {
    const searchToken = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      if (roleFilter !== 'All' && !(user.roles ?? []).includes(roleFilter)) {
        return false
      }

      const statusValue = isUserLocked(user) ? 'Locked' : 'Active'
      if (statusFilter !== 'All' && statusValue !== statusFilter) {
        return false
      }

      if (!searchToken) {
        return true
      }

      const searchableText = [user.userName, user.email, ...(user.roles ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(searchToken)
    })
  }, [roleFilter, searchTerm, statusFilter, users])

  const userRows = useMemo(
    () =>
      filteredUsers.map((user) => {
        const locked = isUserLocked(user)
        return {
          id: user.userId,
          userName: user.userName || 'Not set',
          email: user.email,
          roles: (user.roles ?? []).join(', ') || 'Not assigned',
          status: locked ? 'Locked' : 'Active',
          lockoutEnd: formatDateTimeValue(user.lockoutEnd),
          source: user,
        }
      }),
    [filteredUsers],
  )

  const columns = useMemo(
    () => [
      { key: 'userName', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'roles', label: 'Roles' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <span className={`member-status ${row.status.toLowerCase()}`}>{row.status}</span>,
      },
      { key: 'lockoutEnd', label: 'Lockout end' },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => {
          const isActionBusy = pendingActionUserId === row.source.userId
          const locked = row.status === 'Locked'

          return (
            <div className="table-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditModal(row.source)}
                disabled={isActionBusy || isSaving}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLockToggle(row.source)}
                disabled={isActionBusy || isSaving}
              >
                {locked ? 'Unlock' : 'Lock'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteUser(row.source)}
                disabled={isActionBusy || isSaving}
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [handleDeleteUser, handleLockToggle, isSaving, openEditModal, pendingActionUserId],
  )

  const totalUsers = users.length
  const activeUsers = users.filter((user) => !isUserLocked(user)).length
  const lockedUsers = users.filter((user) => isUserLocked(user)).length
  const administrators = users.filter((user) => (user.roles ?? []).includes('Admin')).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Users and settings</p>
          <h1 className="page-title">Users and Roles</h1>
          <p className="page-subtitle">Manage user accounts, role assignments, and account status.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={loadUsersAndRoles} disabled={isLoading || isSaving || isRoleSaving}>
            Refresh
          </Button>
          {activeManagementTab === 'users' ? <Button onClick={openCreateModal}>Add user</Button> : null}
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total users" subtitle="All accounts">
          <div className="metric-value">{totalUsers}</div>
          <p className="metric-meta">In the system</p>
        </Card>
        <Card className="metric-card reveal" title="Active" subtitle="Unlocked accounts">
          <div className="metric-value">{activeUsers}</div>
          <p className="metric-meta">Can access the platform</p>
        </Card>
        <Card className="metric-card reveal" title="Locked" subtitle="Restricted accounts">
          <div className="metric-value">{lockedUsers}</div>
          <p className="metric-meta">Temporarily blocked</p>
        </Card>
        <Card className="metric-card reveal" title="Administrators" subtitle="Admin role">
          <div className="metric-value">{administrators}</div>
          <p className="metric-meta">System-level access</p>
        </Card>
      </section>

      <Card
        className="reveal"
        title="Management"
        subtitle="Switch between user accounts and role administration."
        action={<Tabs tabs={MANAGEMENT_TABS} active={activeManagementTab} onChange={setActiveManagementTab} />}
      >
        {pageError ? (
          <p className="alert" role="alert">
            {pageError}
          </p>
        ) : null}
        {activeManagementTab === 'users' ? (
          <>
            <div className="filters-row">
              <input
                type="search"
                placeholder="Search by username, email, or role"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                {roleFilterOptions.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName === 'All' ? 'All roles' : roleName}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
            {isLoading ? (
              <p className="table-meta">Loading users...</p>
            ) : userRows.length === 0 ? (
              <p className="table-meta">No users found for the selected filters.</p>
            ) : (
              <DataTable columns={columns} rows={userRows} />
            )}
          </>
        ) : (
          <>
            <div className="roles-toolbar">
              <label className="form-field">
                <span>New role name</span>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleCreateRole()
                    }
                  }}
                  placeholder="Enter role name"
                  minLength={MIN_ROLE_NAME_LENGTH}
                />
              </label>
              <Button onClick={handleCreateRole} disabled={isRoleSaving || isLoading}>
                {isRoleSaving ? 'Saving...' : 'Create role'}
              </Button>
            </div>
            {roles.length === 0 ? (
              <p className="table-meta">No roles available. Create a role to start assigning users.</p>
            ) : (
              <div className="roles-list">
                {roles.map((roleName) => (
                  <div key={roleName} className="role-item">
                    <span className="tag">{roleName}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteRole(roleName)}
                      disabled={isRoleSaving || pendingRoleName === roleName || isSaving}
                    >
                      {pendingRoleName === roleName ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={isModalOpen}
        title={formMode === 'create' ? 'Add user' : 'Edit user'}
        subtitle={
          formMode === 'create'
            ? 'Create a new account and assign role(s).'
            : `Update user profile and role(s) for ${toDisplayValue(activeUser?.email)}.`
        }
        onClose={closeModal}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? 'Saving...' : formMode === 'create' ? 'Create user' : 'Save changes'}
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
            <span>Email</span>
            <input
              type="email"
              value={formValues.email}
              onChange={updateField('email')}
              placeholder="name@organization.org"
              required
            />
          </label>
          <label className="form-field">
            <span>Username</span>
            <input
              type="text"
              value={formValues.userName}
              onChange={updateField('userName')}
              placeholder="Leave blank to use email"
            />
          </label>
          {formMode === 'create' ? (
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={formValues.password}
                onChange={updateField('password')}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </label>
          ) : null}
          <label className="form-field">
            <span>Phone number</span>
            <input
              type="tel"
              value={formValues.phoneNumber}
              onChange={updateField('phoneNumber')}
              placeholder="Optional"
            />
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formValues.emailConfirmed}
              onChange={updateField('emailConfirmed')}
            />
            <span>Email confirmed</span>
          </label>
          {formMode === 'edit' ? (
            <>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formValues.twoFactorEnabled}
                  onChange={updateField('twoFactorEnabled')}
                />
                <span>Two-factor enabled</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formValues.lockoutEnabled}
                  onChange={updateField('lockoutEnabled')}
                />
                <span>Lockout enabled</span>
              </label>
            </>
          ) : null}
          <div className="form-field form-field-full">
            <span>Roles</span>
            {roles.length === 0 ? (
              <p className="table-meta">No roles found. Create a role first in the role management section.</p>
            ) : (
              <div className="checkbox-group">
                {roles.map((roleName) => (
                  <label key={roleName} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formValues.roles.includes(roleName)}
                      onChange={toggleRole(roleName)}
                    />
                    <span>{roleName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
