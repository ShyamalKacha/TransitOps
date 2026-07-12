import { useEffect, useState } from 'react';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MAINTENANCE_STATUS_OPTIONS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Column } from '../components/ui/DataTable';
import type { MaintenanceRecord as MaintenanceType, MaintenanceCreate } from '../types';
import api from '../api/client';

export function MaintenancePage() {
  const { records, loading, fetchRecords, createRecord, closeRecord } = useMaintenanceStore();
  const user = useAuthStore((s) => s.user);
  const isFleetManager = user?.role === 'admin' || user?.role === 'fleet_manager';

  const [statusFilter, setStatusFilter] = useState('');
  const [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [form, setForm] = useState<MaintenanceCreate>({
    vehicle_id: '', description: '', type: '', cost: undefined, scheduled_date: '', notes: '',
  });

  useEffect(() => { fetchRecords({ status: statusFilter || undefined }); }, [statusFilter]);
  useEffect(() => {
    api.get('/vehicles').then(({ data }) => setVehicles((data.data ?? data).map((v: any) => ({ id: String(v.id), name: v.registration_number }))));
  }, []);

  const handleCreate = async () => {
    await createRecord(form);
    setShowModal(false);
    setForm({ vehicle_id: '', description: '', type: '', cost: undefined, scheduled_date: '', notes: '' });
    fetchRecords();
  };

  const columns: Column<MaintenanceType>[] = [
    { key: 'vehicle_id', header: 'Vehicle ID' },
    { key: 'description', header: 'Description' },
    { key: 'type', header: 'Type' },
    { key: 'cost', header: 'Cost', render: (r) => r.cost ? formatCurrency(r.cost) : '—' },
    {
      key: 'status', header: 'Status',
      render: (r) => {
        const opt = MAINTENANCE_STATUS_OPTIONS.find((o) => o.value === r.status);
        return <StatusBadge label={opt?.label ?? r.status} color={opt?.color ?? 'gray'} />;
      },
    },
    { key: 'scheduled_date', header: 'Scheduled', render: (r) => formatDate(r.scheduled_date) },
    { key: 'completed_date', header: 'Completed', render: (r) => formatDate(r.completed_date) },
    ...(isFleetManager ? [{
      key: 'actions' as string, header: 'Actions',
      render: (r: MaintenanceType) =>
        r.status === 'open' ? (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setCloseId(r.id); }}>Close</Button>
        ) : null,
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Maintenance</h1>
        {isFleetManager && <Button onClick={() => setShowModal(true)}>Add Record</Button>}
      </div>

      <div className="mb-4 max-w-xs">
        <Select
          id="status-filter"
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={MAINTENANCE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </div>

      <DataTable columns={columns} data={records} loading={loading} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Maintenance Record">
        <div className="space-y-3">
          <Select id="vehicle" label="Vehicle" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            options={vehicles.map((v) => ({ value: v.id, label: v.name }))} />
          <Input id="desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input id="type" label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input id="cost" label="Cost" type="number" value={form.cost ?? ''} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) || undefined })} />
          <Input id="sched" label="Scheduled Date" type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
          <Input id="notes" label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button className="w-full" onClick={handleCreate}>Create</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!closeId} onClose={() => setCloseId(null)} onConfirm={() => { if (closeId) closeRecord(closeId); setCloseId(null); }}
        title="Close Maintenance" message="Are you sure? This will restore the vehicle to Available." confirmLabel="Close" />
    </div>
  );
}
