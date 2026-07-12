import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatNumber } from '../utils/formatters';
import { VEHICLE_STATUS_OPTIONS } from '../utils/constants';
import type { Column } from '../components/ui/DataTable';
import type { Vehicle, VehicleCreate } from '../types';

const VEHICLE_TYPE_OPTIONS = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'bus', label: 'Bus' },
  { value: 'suv', label: 'SUV' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM: VehicleCreate = {
  registration_number: '',
  name: '',
  model: '',
  vehicle_type: '',
  max_load_capacity: 0,
  odometer: 0,
  acquisition_cost: 0,
};

const NUMBER_FIELDS: (keyof VehicleCreate)[] = [
  'max_load_capacity',
  'odometer',
  'acquisition_cost',
];

export function VehiclesPage() {
  const { user } = useAuthStore();
  const { vehicles, loading, fetchVehicles, createVehicle, updateVehicle, deleteVehicle } =
    useVehicleStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleCreate>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canMutate = user?.role === 'admin' || user?.role === 'fleet_manager';
  const canView =
    user && ['admin', 'fleet_manager', 'dispatcher'].includes(user.role);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ---- Role gate ----
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // ---- Form helpers ----
  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = useCallback((vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      registration_number: vehicle.registration_number,
      name: vehicle.name,
      model: vehicle.model,
      vehicle_type: vehicle.vehicle_type,
      max_load_capacity: vehicle.max_load_capacity,
      odometer: vehicle.odometer,
      acquisition_cost: vehicle.acquisition_cost,
    });
    setErrors({});
    setModalOpen(true);
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const handleChange = (field: keyof VehicleCreate, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: NUMBER_FIELDS.includes(field) ? Number(value) || 0 : value,
    }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.registration_number.trim()) {
      next.registration_number = 'Registration number is required';
    }
    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    if (!form.max_load_capacity || form.max_load_capacity <= 0) {
      next.max_load_capacity = 'Must be a positive number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateVehicle(editingId, form);
      } else {
        await createVehicle(form);
      }
      closeModal();
      await fetchVehicles();
    } catch {
      setErrors({ form: 'Failed to save vehicle. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = useCallback((vehicle: Vehicle) => {
    setDeletingId(vehicle.id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteVehicle(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      await fetchVehicles();
    } catch {
      // silently ignore; could surface toast in future
    }
  };

  // ---- Columns ----
  const columns: Column<Vehicle>[] = [
    { key: 'registration_number', header: 'Registration No.' },
    { key: 'name', header: 'Name' },
    { key: 'model', header: 'Model' },
    { key: 'vehicle_type', header: 'Type' },
    {
      key: 'status',
      header: 'Status',
      render: (vehicle) => {
        const opt = VEHICLE_STATUS_OPTIONS.find((o) => o.value === vehicle.status);
        return <StatusBadge label={opt?.label ?? vehicle.status} color={opt?.color} />;
      },
    },
    {
      key: 'odometer',
      header: 'Odometer (km)',
      render: (vehicle) => formatNumber(vehicle.odometer, 0),
    },
    {
      key: 'max_load_capacity',
      header: 'Max Load (kg)',
      render: (vehicle) => formatNumber(vehicle.max_load_capacity, 0),
    },
  ];

  if (canMutate) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (vehicle) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(vehicle)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => openDeleteDialog(vehicle)}
          >
            Delete
          </Button>
        </div>
      ),
    });
  }

  // ---- Render ----
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Vehicles
        </h1>
        {canMutate && (
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <DataTable<Vehicle>
          columns={columns}
          data={vehicles}
          loading={loading}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <div className="space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg">
              {errors.form}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="reg-number"
              label="Registration Number"
              placeholder="e.g. ABC-1234"
              value={form.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value)}
              error={errors.registration_number}
              required
            />
            <Input
              id="name"
              label="Name"
              placeholder="e.g. Truck 01"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
            />
            <Input
              id="model"
              label="Model"
              placeholder="e.g. Volvo FH16"
              value={form.model ?? ''}
              onChange={(e) => handleChange('model', e.target.value)}
            />
            <Select
              id="vehicle-type"
              label="Vehicle Type"
              options={VEHICLE_TYPE_OPTIONS}
              value={form.vehicle_type ?? ''}
              onChange={(e) => handleChange('vehicle_type', e.target.value)}
            />
            <Input
              id="max-load"
              label="Max Load Capacity (kg)"
              type="number"
              min={0}
              placeholder="e.g. 25000"
              value={form.max_load_capacity || ''}
              onChange={(e) => handleChange('max_load_capacity', e.target.value)}
              error={errors.max_load_capacity}
              required
            />
            <Input
              id="odometer"
              label="Odometer (km)"
              type="number"
              min={0}
              placeholder="e.g. 15000"
              value={form.odometer || ''}
              onChange={(e) => handleChange('odometer', e.target.value)}
            />
            <Input
              id="acquisition-cost"
              label="Acquisition Cost ($)"
              type="number"
              min={0}
              placeholder="e.g. 75000"
              value={form.acquisition_cost || ''}
              onChange={(e) => handleChange('acquisition_cost', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
