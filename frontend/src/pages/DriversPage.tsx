import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDriverStore } from '../stores/driverStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DRIVER_STATUS_OPTIONS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import type { Driver, DriverCreate } from '../types';

const EMPTY_FORM: DriverCreate = {
  name: '',
  license_number: '',
  license_category: '',
  license_expiry_date: '',
  contact_number: '',
};

export function DriversPage() {
  const { user } = useAuthStore();
  const { drivers, loading, fetchDrivers, createDriver, updateDriver, deleteDriver, changeStatus, updateSafetyScore } =
    useDriverStore();

  // --- Add / Edit modal ---
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverCreate>(EMPTY_FORM);

  // --- Delete confirm ---
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Safety Score modal ---
  const [safetyScoreModalOpen, setSafetyScoreModalOpen] = useState(false);
  const [safetyScoreDriver, setSafetyScoreDriver] = useState<Driver | null>(null);
  const [newSafetyScore, setNewSafetyScore] = useState<number>(0);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // --- Role checks ---
  const role = user?.role;
  const canManage = role === 'admin' || role === 'fleet_manager';
  const canManageSafety = role === 'admin' || role === 'safety_officer';

  // --- Handlers ---

  const openAddModal = () => {
    setEditingDriver(null);
    setForm(EMPTY_FORM);
    setDriverModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category ?? '',
      license_expiry_date: driver.license_expiry_date,
      contact_number: driver.contact_number ?? '',
    });
    setDriverModalOpen(true);
  };

  const closeDriverModal = () => {
    setDriverModalOpen(false);
    setEditingDriver(null);
    setForm(EMPTY_FORM);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, form);
      } else {
        await createDriver(form);
      }
      closeDriverModal();
      await fetchDrivers();
    } catch {
      // error handled globally via axios interceptor
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteDriver(deletingId);
      await fetchDrivers();
    } catch {
      // handled globally
    }
    setDeletingId(null);
  };

  const handleToggleSuspend = async (driver: Driver) => {
    const newStatus = driver.status === 'suspended' ? 'available' : 'suspended';
    try {
      await changeStatus(driver.id, newStatus);
      await fetchDrivers();
    } catch {
      // handled globally
    }
  };

  const openSafetyScoreModal = (driver: Driver) => {
    setSafetyScoreDriver(driver);
    setNewSafetyScore(driver.safety_score);
    setSafetyScoreModalOpen(true);
  };

  const handleSafetyScoreUpdate = async () => {
    if (!safetyScoreDriver) return;
    try {
      await updateSafetyScore(safetyScoreDriver.id, newSafetyScore);
      setSafetyScoreModalOpen(false);
      setSafetyScoreDriver(null);
      await fetchDrivers();
    } catch {
      // handled globally
    }
  };

  // --- Columns ---

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Name' },
    { key: 'license_number', header: 'License Number' },
    { key: 'license_category', header: 'License Category' },
    {
      key: 'license_expiry_date',
      header: 'Expiry Date',
      render: (d) => formatDate(d.license_expiry_date),
    },
    {
      key: 'safety_score',
      header: 'Safety Score',
      render: (d) => (
        <span className="font-medium">{d.safety_score}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => {
        const opt = DRIVER_STATUS_OPTIONS.find((o) => o.value === d.status);
        return <StatusBadge label={opt?.label ?? d.status} color={opt?.color} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex items-center gap-1 flex-wrap">
          {canManage && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); openEditModal(d); }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(d.id); }}
              >
                Delete
              </Button>
            </>
          )}
          {canManageSafety && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleToggleSuspend(d); }}
              >
                {d.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); openSafetyScoreModal(d); }}
              >
                Safety Score
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Drivers</h1>
        {canManage && (
          <Button onClick={openAddModal}>Add Driver</Button>
        )}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={drivers} loading={loading} emptyMessage="No drivers found." />

      {/* Add / Edit Driver Modal */}
      <Modal
        open={driverModalOpen}
        onClose={closeDriverModal}
        title={editingDriver ? 'Edit Driver' : 'Add Driver'}
      >
        <form onSubmit={handleSaveDriver} className="space-y-4">
          <Input
            label="Name"
            id="driver-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="License Number"
            id="driver-license-number"
            value={form.license_number}
            onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
            required
          />
          <Input
            label="License Category"
            id="driver-license-category"
            value={form.license_category ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, license_category: e.target.value }))}
          />
          <Input
            label="License Expiry Date"
            id="driver-license-expiry"
            type="date"
            value={form.license_expiry_date}
            onChange={(e) => setForm((f) => ({ ...f, license_expiry_date: e.target.value }))}
            required
          />
          <Input
            label="Contact Number"
            id="driver-contact"
            value={form.contact_number ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeDriverModal}>
              Cancel
            </Button>
            <Button type="submit">{editingDriver ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Safety Score Modal */}
      <Modal
        open={safetyScoreModalOpen}
        onClose={() => setSafetyScoreModalOpen(false)}
        title="Update Safety Score"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Updating safety score for{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {safetyScoreDriver?.name}
            </span>
          </p>
          <Input
            label="Safety Score (0–100)"
            id="safety-score-input"
            type="number"
            min={0}
            max={100}
            value={String(newSafetyScore)}
            onChange={(e) => setNewSafetyScore(Number(e.target.value))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setSafetyScoreModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSafetyScoreUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
