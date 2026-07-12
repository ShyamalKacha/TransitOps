import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ROLE_LABELS } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import type { User, UserRole } from '../types';

// ---- Types ----

interface AdminUser extends User {
  created_at: string | null;
}

// ---- Constants ----

const ASSIGNABLE_ROLES: UserRole[] = [
  'fleet_manager',
  'dispatcher',
  'driver',
  'safety_officer',
  'financial_analyst',
];

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

// ---- Component ----

export function AdminUsersPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  // ---- Data state ----
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ---- Add User modal ----
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'fleet_manager' as UserRole | '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // ---- Change Role modal ----
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole | ''>('');
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState('');

  // ---- Auth guard ----
  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [authUser, authLoading, navigate]);

  // ---- Fetch users ----
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data ?? res.data);
    } catch (err: any) {
      setFetchError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser || authUser.role !== 'admin') return;
    fetchUsers();
  }, [authLoading, authUser, fetchUsers]);

  // ---- Add User handlers ----
  const openAddModal = () => {
    setAddForm({ name: '', email: '', password: '', role: 'fleet_manager' });
    setAddError('');
    setAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.role) {
      setAddError('All fields are required');
      return;
    }
    setAddSubmitting(true);
    setAddError('');
    try {
      await api.post('/admin/users', addForm);
      setAddOpen(false);
      fetchUsers();
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to add user');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- Change Role handlers ----
  const openRoleModal = (u: AdminUser) => {
    setRoleUser(u);
    setNewRole(u.role);
    setRoleError('');
  };

  const handleRoleSubmit = async () => {
    if (!roleUser || !newRole) return;
    setRoleSubmitting(true);
    setRoleError('');
    try {
      await api.patch(`/admin/users/${roleUser.id}/role`, { role: newRole });
      setRoleUser(null);
      fetchUsers();
    } catch (err: any) {
      setRoleError(err?.response?.data?.message || 'Failed to change role');
    } finally {
      setRoleSubmitting(false);
    }
  };

  // ---- Columns ----
  const columns: Column<AdminUser>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => ROLE_LABELS[u.role],
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <StatusBadge
          label={u.is_active ? 'Active' : 'Inactive'}
          color={u.is_active ? 'green' : 'red'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (u) => formatDateTime(u.created_at),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openRoleModal(u);
          }}
        >
          Change Role
        </Button>
      ),
    },
  ];

  // ---- Loading / Guard renders ----
  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!authUser || authUser.role !== 'admin') {
    return null;
  }

  // ---- Main render ----
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Users</h1>
        <Button onClick={openAddModal}>Add User</Button>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
          {fetchError}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm">
        <DataTable<AdminUser>
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

      {/* Add User Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            id="add-name"
            label="Name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />
          <Input
            id="add-email"
            label="Email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            required
          />
          <Input
            id="add-password"
            label="Password"
            type="password"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            required
          />
          <Select
            id="add-role"
            label="Role"
            options={ROLE_OPTIONS}
            value={addForm.role}
            onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
          />
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addSubmitting}>
              {addSubmitting ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        open={!!roleUser}
        onClose={() => setRoleUser(null)}
        title={`Change Role — ${roleUser?.name || ''}`}
      >
        {roleUser && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current role:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {ROLE_LABELS[roleUser.role]}
              </span>
            </p>
            <Select
              id="change-role"
              label="New Role"
              options={ROLE_OPTIONS}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            />
            {roleError && <p className="text-sm text-red-600">{roleError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setRoleUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleRoleSubmit} disabled={roleSubmitting}>
                {roleSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
