import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import { useNotify } from '../hooks/useNotify'
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const LOCKOUT_MINUTES = 30
const MIN_ROLE_NAME_LENGTH = 2
const MANAGEMENT_TABS = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
]
const EMPTY_PERMISSION_CATALOG = []

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

  if (status === 403) {
    return 'You do not have permission to perform this action.'
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
  const [rolePermissionMap, setRolePermissionMap] = useState({})
  const [permissionCatalog, setPermissionCatalog] = useState(EMPTY_PERMISSION_CATALOG)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPermissionSaving, setIsPermissionSaving] = useState(false)
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
  const [selectedRoleName, setSelectedRoleName] = useState('')
  const [rolePermissionDraft, setRolePermissionDraft] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [activeUser, setActiveUser] = useState(null)
  const [formValues, setFormValues] = useState(() => createEmptyForm())

  const authHeader = useMemo(() => {
    const token = session?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [session?.accessToken])

  const canViewUsers = hasPermission(session, PERMISSIONS.USERS_READ)
  const canCreateUsers = hasPermission(session, PERMISSIONS.USERS_CREATE)
  const canUpdateUsers = hasPermission(session, PERMISSIONS.USERS_UPDATE)
  const canDeleteUsers = hasPermission(session, PERMISSIONS.USERS_DELETE)
  const canViewRoles = hasPermission(session, PERMISSIONS.ROLES_READ)
  const canCreateRoles = hasPermission(session, PERMISSIONS.ROLES_CREATE)
  const canDeleteRoles = hasPermission(session, PERMISSIONS.ROLES_DELETE)
  const canManageRolePermissions = hasPermission(session, PERMISSIONS.ROLES_MANAGE_PERMISSIONS)

  const availableManagementTabs = useMemo(
    () =>
      MANAGEMENT_TABS.filter((tab) =>
        tab.id === 'users' ? canViewUsers : canViewRoles,
      ),
    [canViewRoles, canViewUsers],
  )

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

    const roleRecords = Array.isArray(payload.data) ? payload.data : []
    const normalizedRoleRecords = roleRecords
      .filter((role) => typeof role?.name === 'string' && role.name.trim().length > 0)
      .map((role) => ({
        name: role.name.trim(),
        permissions: Array.isArray(role.permissions)
          ? role.permissions
              .map((permission) => String(permission ?? '').trim())
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b))
          : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const roleNames = normalizedRoleRecords.map((role) => role.name)
    const permissionsByRole = normalizedRoleRecords.reduce((accumulator, role) => {
      accumulator[role.name] = role.permissions
      return accumulator
    }, {})

    return {
      roleNames,
      permissionsByRole,
    }
  }, [authHeader])

  const fetchPermissionCatalog = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/roles/permission-catalog`, {
      headers: authHeader,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.succeeded) {
      throw new Error(getApiErrorMessage(payload, response.status, 'Failed to load permission catalog.'))
    }

    return Array.isArray(payload.data) ? payload.data : EMPTY_PERMISSION_CATALOG
  }, [authHeader])

  const loadUsersAndRoles = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      if (!canViewUsers && !canViewRoles) {
        setUsers([])
        setRoles([])
        setRolePermissionMap({})
        setPermissionCatalog(EMPTY_PERMISSION_CATALOG)
        setPageError('You do not have permission to view users or roles.')
        return
      }

      const [usersPayload, rolesPayload, permissionCatalogPayload] = await Promise.all([
        canViewUsers ? fetchUsers() : Promise.resolve([]),
        canViewRoles ? fetchRoles() : Promise.resolve({ roleNames: [], permissionsByRole: {} }),
        canViewRoles ? fetchPermissionCatalog() : Promise.resolve(EMPTY_PERMISSION_CATALOG),
      ])

      setUsers(usersPayload)
      setRoles(rolesPayload.roleNames)
      setRolePermissionMap(rolesPayload.permissionsByRole)
      setPermissionCatalog(permissionCatalogPayload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user management data.'
      setPageError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [canViewRoles, canViewUsers, fetchPermissionCatalog, fetchRoles, fetchUsers, notify])

  useEffect(() => {
    loadUsersAndRoles()
  }, [loadUsersAndRoles])

  useEffect(() => {
    if (availableManagementTabs.length === 0) {
      return
    }

    const hasActiveTab = availableManagementTabs.some((tab) => tab.id === activeManagementTab)
    if (!hasActiveTab) {
      setActiveManagementTab(availableManagementTabs[0].id)
    }
  }, [activeManagementTab, availableManagementTabs])

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

  useEffect(() => {
    if (!canViewRoles || roles.length === 0) {
      setSelectedRoleName('')
      setRolePermissionDraft([])
      return
    }

    if (!selectedRoleName || !roles.includes(selectedRoleName)) {
      setSelectedRoleName(roles[0])
    }
  }, [canViewRoles, roles, selectedRoleName])

  useEffect(() => {
    if (!selectedRoleName) {
      setRolePermissionDraft([])
      return
    }

    setRolePermissionDraft(rolePermissionMap[selectedRoleName] ?? [])
  }, [rolePermissionMap, selectedRoleName])

  const openCreateModal = useCallback(() => {
    if (!canCreateUsers) {
      notify.error('You do not have permission to create users.')
      return
    }

    setFormMode('create')
    setActiveUser(null)
    setSaveError('')
    setFormValues(createEmptyForm())
    setIsModalOpen(true)
  }, [canCreateUsers, notify])

  const openEditModal = useCallback((user) => {
    if (!canUpdateUsers) {
      notify.error('You do not have permission to update users.')
      return
    }

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
  }, [canUpdateUsers, notify])

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
    if (formMode === 'create' && !canCreateUsers) {
      notify.error('You do not have permission to create users.')
      return
    }

    if (formMode === 'edit' && !canUpdateUsers) {
      notify.error('You do not have permission to update users.')
      return
    }

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
  }, [
    activeUser?.userId,
    authHeader,
    canCreateUsers,
    canUpdateUsers,
    closeModal,
    formMode,
    formValues,
    loadUsersAndRoles,
    notify,
  ])

  const handleLockToggle = useCallback(async (user) => {
    if (!canUpdateUsers) {
      notify.error('You do not have permission to update users.')
      return
    }

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
  }, [authHeader, canUpdateUsers, loadUsersAndRoles, notify])

  const handleDeleteUser = useCallback(async (user) => {
    if (!canDeleteUsers) {
      notify.error('You do not have permission to delete users.')
      return
    }

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
  }, [authHeader, canDeleteUsers, loadUsersAndRoles, notify])

  const handleCreateRole = useCallback(async () => {
    if (!canCreateRoles) {
      notify.error('You do not have permission to create roles.')
      return
    }

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
  }, [authHeader, canCreateRoles, loadUsersAndRoles, newRoleName, notify, roles])

  const handleDeleteRole = useCallback(async (roleName) => {
    if (!canDeleteRoles) {
      notify.error('You do not have permission to delete roles.')
      return
    }

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
  }, [authHeader, canDeleteRoles, loadUsersAndRoles, notify, users])

  const toggleRolePermission = useCallback((permissionKey) => {
    setRolePermissionDraft((prev) => {
      const normalizedKey = String(permissionKey ?? '').trim()
      if (!normalizedKey) {
        return prev
      }

      const hasSelected = prev.includes(normalizedKey)
      const nextPermissions = hasSelected
        ? prev.filter((permission) => permission !== normalizedKey)
        : [...prev, normalizedKey]

      return nextPermissions.sort((a, b) => a.localeCompare(b))
    })
  }, [])

  const handleSaveRolePermissions = useCallback(async () => {
    if (!canManageRolePermissions) {
      notify.error('You do not have permission to manage role permissions.')
      return
    }

    if (!selectedRoleName) {
      notify.error('Select a role first.')
      return
    }

    setIsPermissionSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/roles/${encodeURIComponent(selectedRoleName)}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          permissions: rolePermissionDraft,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.succeeded) {
        throw new Error(getApiErrorMessage(payload, response.status, 'Failed to update role permissions.'))
      }

      await loadUsersAndRoles()
      notify.success(`Permissions updated for ${selectedRoleName}.`)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to update role permissions.')
    } finally {
      setIsPermissionSaving(false)
    }
  }, [authHeader, canManageRolePermissions, loadUsersAndRoles, notify, rolePermissionDraft, selectedRoleName])

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
          const hasRowActions = canUpdateUsers || canDeleteUsers

          if (!hasRowActions) {
            return <span className="table-meta">No actions</span>
          }

          return (
            <div className="table-actions">
              {canUpdateUsers ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(row.source)}
                  disabled={isActionBusy || isSaving}
                >
                  Edit
                </Button>
              ) : null}
              {canUpdateUsers ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLockToggle(row.source)}
                  disabled={isActionBusy || isSaving}
                >
                  {locked ? 'Unlock' : 'Lock'}
                </Button>
              ) : null}
              {canDeleteUsers ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteUser(row.source)}
                  disabled={isActionBusy || isSaving}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          )
        },
      },
    ],
    [canDeleteUsers, canUpdateUsers, handleDeleteUser, handleLockToggle, isSaving, openEditModal, pendingActionUserId],
  )

  const totalUsers = users.length
  const activeUsers = users.filter((user) => !isUserLocked(user)).length
  const lockedUsers = users.filter((user) => isUserLocked(user)).length
  const administrators = users.filter((user) => (user.roles ?? []).includes('Admin')).length
  const selectedRoleAssignedUsersCount = selectedRoleName
    ? users.filter((user) => (user.roles ?? []).includes(selectedRoleName)).length
    : 0
  const permissionFeatures = useMemo(() => {
    const groupedPermissions = permissionCatalog.reduce((groups, permission) => {
      const featureKey = permission.featureKey || 'other'
      if (!groups.has(featureKey)) {
        groups.set(featureKey, {
          featureKey,
          featureLabel: permission.featureLabel || permission.featureKey || 'Other',
          permissions: [],
        })
      }

      groups.get(featureKey).permissions.push(permission)
      return groups
    }, new Map())

    return [...groupedPermissions.values()]
      .map((group) => ({
        ...group,
        permissions: [...group.permissions].sort((a, b) => a.actionLabel.localeCompare(b.actionLabel)),
      }))
      .sort((a, b) => a.featureLabel.localeCompare(b.featureLabel))
  }, [permissionCatalog])
  const hasUnsavedRolePermissionChanges = useMemo(() => {
    if (!selectedRoleName) {
      return false
    }

    const current = [...(rolePermissionMap[selectedRoleName] ?? [])].sort()
    const draft = [...rolePermissionDraft].sort()

    if (current.length !== draft.length) {
      return true
    }

    return current.some((permission, index) => permission !== draft[index])
  }, [rolePermissionDraft, rolePermissionMap, selectedRoleName])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Users and settings</p>
          <h1 className="page-title">Users and Roles</h1>
          <p className="page-subtitle">Manage user accounts, role assignments, and account status.</p>
        </div>
        <div className="page-actions">
          <Button
            variant="outline"
            onClick={loadUsersAndRoles}
            disabled={isLoading || isSaving || isRoleSaving || isPermissionSaving}
          >
            Refresh
          </Button>
          {activeManagementTab === 'users' && canCreateUsers ? <Button onClick={openCreateModal}>Add user</Button> : null}
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
        action={<Tabs tabs={availableManagementTabs} active={activeManagementTab} onChange={setActiveManagementTab} />}
      >
        {pageError ? (
          <p className="alert" role="alert">
            {pageError}
          </p>
        ) : null}
        {availableManagementTabs.length === 0 ? (
          <p className="table-meta">No user or role management permissions assigned to your account.</p>
        ) : activeManagementTab === 'users' ? (
          <>
            {!canViewUsers ? (
              <p className="table-meta">You do not have permission to view users.</p>
            ) : null}
            <div className="filters-row">
              <input
                type="search"
                placeholder="Search by username, email, or role"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={!canViewUsers}
              />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} disabled={!canViewUsers}>
                {roleFilterOptions.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName === 'All' ? 'All roles' : roleName}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!canViewUsers}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
            {!canViewUsers ? (
              <p className="table-meta">Users tab is unavailable for your account.</p>
            ) : isLoading ? (
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
                  disabled={!canCreateRoles || isRoleSaving || isLoading}
                />
              </label>
              <Button onClick={handleCreateRole} disabled={!canCreateRoles || isRoleSaving || isLoading}>
                {isRoleSaving ? 'Saving...' : 'Create role'}
              </Button>
            </div>
            {!canViewRoles ? (
              <p className="table-meta">You do not have permission to view roles.</p>
            ) : roles.length === 0 ? (
              <p className="table-meta">No roles available. Create a role to start assigning users.</p>
            ) : (
              <>
                <div className="roles-list">
                  {roles.map((roleName) => {
                    const permissionCount = (rolePermissionMap[roleName] ?? []).length

                    return (
                      <div key={roleName} className="role-item">
                        <span className="tag">{roleName}</span>
                        <span className="table-meta">{permissionCount} permission{permissionCount === 1 ? '' : 's'}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRoleName(roleName)}
                          disabled={isPermissionSaving}
                        >
                          {selectedRoleName === roleName ? 'Selected' : 'Manage access'}
                        </Button>
                        {canDeleteRoles ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRole(roleName)}
                            disabled={isRoleSaving || pendingRoleName === roleName || isSaving || isPermissionSaving}
                          >
                            {pendingRoleName === roleName ? 'Deleting...' : 'Delete'}
                          </Button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {selectedRoleName ? (
                  <div className="form-grid" style={{ marginTop: '1rem' }}>
                    <div className="form-field form-field-full">
                      <span>Selected role</span>
                      <div className="filters-row">
                        <select
                          value={selectedRoleName}
                          onChange={(event) => setSelectedRoleName(event.target.value)}
                          disabled={isPermissionSaving}
                        >
                          {roles.map((roleName) => (
                            <option key={roleName} value={roleName}>
                              {roleName}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          onClick={() => setRolePermissionDraft(rolePermissionMap[selectedRoleName] ?? [])}
                          disabled={isPermissionSaving || !hasUnsavedRolePermissionChanges}
                        >
                          Reset changes
                        </Button>
                        <Button
                          onClick={handleSaveRolePermissions}
                          disabled={!canManageRolePermissions || isPermissionSaving || !hasUnsavedRolePermissionChanges}
                        >
                          {isPermissionSaving ? 'Saving access...' : 'Save role access'}
                        </Button>
                      </div>
                      <p className="table-meta">
                        {selectedRoleName} is assigned to {selectedRoleAssignedUsersCount} user{selectedRoleAssignedUsersCount === 1 ? '' : 's'}.
                        {canManageRolePermissions
                          ? ' Select what this role can do per feature.'
                          : ' You can view permissions but cannot change them.'}
                      </p>
                    </div>

                    {permissionFeatures.length === 0 ? (
                      <p className="table-meta">No permission catalog available.</p>
                    ) : (
                      permissionFeatures.map((featureGroup) => (
                        <div key={featureGroup.featureKey} className="form-field form-field-full">
                          <span>{featureGroup.featureLabel}</span>
                          <div className="checkbox-group">
                            {featureGroup.permissions.map((permission) => (
                              <label key={permission.key} className="checkbox-option" title={permission.description || ''}>
                                <input
                                  type="checkbox"
                                  checked={rolePermissionDraft.includes(permission.key)}
                                  onChange={() => toggleRolePermission(permission.key)}
                                  disabled={!canManageRolePermissions || isPermissionSaving}
                                />
                                <span>{permission.actionLabel}</span>
                              </label>
                            ))}
                          </div>
                          {featureGroup.permissions.some((permission) => permission.description) ? (
                            <p className="table-meta">
                              {featureGroup.permissions
                                .map((permission) =>
                                  permission.description ? `${permission.actionLabel}: ${permission.description}` : null,
                                )
                                .filter(Boolean)
                                .join(' ')}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </>
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
            <Button
              onClick={handleSaveUser}
              disabled={
                isSaving ||
                (formMode === 'create' ? !canCreateUsers : !canUpdateUsers)
              }
            >
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
              disabled={formMode === 'create' ? !canCreateUsers : !canUpdateUsers}
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
              disabled={formMode === 'create' ? !canCreateUsers : !canUpdateUsers}
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
                disabled={!canCreateUsers}
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
              disabled={formMode === 'create' ? !canCreateUsers : !canUpdateUsers}
            />
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formValues.emailConfirmed}
              onChange={updateField('emailConfirmed')}
              disabled={formMode === 'create' ? !canCreateUsers : !canUpdateUsers}
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
                  disabled={!canUpdateUsers}
                />
                <span>Two-factor enabled</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formValues.lockoutEnabled}
                  onChange={updateField('lockoutEnabled')}
                  disabled={!canUpdateUsers}
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
                      disabled={formMode === 'create' ? !canCreateUsers : !canUpdateUsers}
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
