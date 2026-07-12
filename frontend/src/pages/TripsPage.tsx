import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { useVehicleStore } from '../stores/vehicleStore';
import { useDriverStore } from '../stores/driverStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TRIP_STATUS_OPTIONS } from '../utils/constants';
import { formatDate, formatDateTime, formatCurrency, formatNumber } from '../utils/formatters';
import type { Trip, TripCreate, TripComplete } from '../types';

const EMPTY_TRIP_FORM: TripCreate = {
  source: '',
  destination: '',
  vehicle_id: '',
  driver_id: '',
  cargo_weight: undefined,
  planned_distance: undefined,
  notes: '',
};

const EMPTY_COMPLETE_FORM: TripComplete = {
  final_odometer: 0,
  fuel_consumed: 0,
  revenue: 0,
  driver_earnings: 0,
  actual_distance: 0,
};

export function TripsPage() {
  const { user } = useAuthStore();
  const { trips, loading, fetchTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } =
    useTripStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { drivers, fetchDrivers } = useDriverStore();

  // --- Filters ---
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');

  // --- Trip Detail modal ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // --- Create Trip modal ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tripForm, setTripForm] = useState<TripCreate>(EMPTY_TRIP_FORM);

  // --- Complete Trip modal ---
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState<TripComplete>(EMPTY_COMPLETE_FORM);

  // --- Cancel confirm ---
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState<Trip | null>(null);

  // --- Fetch on mount ---
  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    fetchDrivers();
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  // --- Role check ---
  const isDispatcher = user?.role === 'dispatcher';

  // --- Lookup maps for vehicle & driver names ---
  const vehicleMap = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach((v) => map.set(v.id, `${v.name} (${v.registration_number})`));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map<string, string>();
    drivers.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [drivers]);

  // --- Filtered trips (client-side) ---
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (vehicleFilter && t.vehicle_id !== vehicleFilter) return false;
      if (driverFilter && t.driver_id !== driverFilter) return false;
      return true;
    });
  }, [trips, statusFilter, vehicleFilter, driverFilter]);

  // --- Handlers ---

  // Row click -> show detail
  const handleRowClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailModalOpen(true);
  };

  // Create trip
  const openCreateModal = () => {
    setTripForm(EMPTY_TRIP_FORM);
    setCreateModalOpen(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrip(tripForm);
      setCreateModalOpen(false);
      setTripForm(EMPTY_TRIP_FORM);
      await fetchTrips();
    } catch {
      // handled globally
    }
  };

  // Dispatch
  const handleDispatch = async (trip: Trip) => {
    try {
      await dispatchTrip(trip.id);
      await fetchTrips();
    } catch {
      // handled globally
    }
  };

  // Complete
  const openCompleteModal = (trip: Trip) => {
    setCompletingTrip(trip);
    setCompleteForm(EMPTY_COMPLETE_FORM);
    setCompleteModalOpen(true);
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrip) return;
    try {
      await completeTrip(completingTrip.id, completeForm);
      setCompleteModalOpen(false);
      setCompletingTrip(null);
      setCompleteForm(EMPTY_COMPLETE_FORM);
      await fetchTrips();
    } catch {
      // handled globally
    }
  };

  // Cancel
  const openCancelConfirm = (trip: Trip) => {
    setCancellingTrip(trip);
    setCancelConfirmOpen(true);
  };

  const handleCancelTrip = async () => {
    if (!cancellingTrip) return;
    try {
      await cancelTrip(cancellingTrip.id);
      await fetchTrips();
    } catch {
      // handled globally
    }
    setCancellingTrip(null);
  };

  // --- Helper to get StatusBadge for a trip ---
  const renderTripStatus = (status: string) => {
    const opt = TRIP_STATUS_OPTIONS.find((o) => o.value === status);
    return <StatusBadge label={opt?.label ?? status} color={opt?.color} />;
  };

  // --- Columns ---

  const columns: Column<Trip>[] = [
    { key: 'source', header: 'Source' },
    { key: 'destination', header: 'Destination' },
    {
      key: 'vehicle_id',
      header: 'Vehicle',
      render: (t) => vehicleMap.get(t.vehicle_id) ?? t.vehicle_id,
    },
    {
      key: 'driver_id',
      header: 'Driver',
      render: (t) => driverMap.get(t.driver_id) ?? t.driver_id,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => renderTripStatus(t.status),
    },
    {
      key: 'dispatched_at',
      header: 'Dispatched At',
      render: (t) => formatDateTime(t.dispatched_at),
    },
    {
      key: 'completed_at',
      header: 'Completed At',
      render: (t) => formatDateTime(t.completed_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {isDispatcher && t.status === 'draft' && (
            <Button size="sm" onClick={() => handleDispatch(t)}>
              Dispatch
            </Button>
          )}
          {isDispatcher && t.status === 'dispatched' && (
            <Button size="sm" variant="secondary" onClick={() => openCompleteModal(t)}>
              Complete
            </Button>
          )}
          {isDispatcher && t.status !== 'completed' && t.status !== 'cancelled' && (
            <Button size="sm" variant="ghost" onClick={() => openCancelConfirm(t)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  // --- Vehicle & driver options for selects ---
  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.name} (${v.registration_number})`,
  }));

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const tripStatusSelectOptions = TRIP_STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  // --- Build detail fields ---
  const detailFields: { label: string; value: string | React.ReactNode }[] = selectedTrip
    ? [
        { label: 'Source', value: selectedTrip.source },
        { label: 'Destination', value: selectedTrip.destination },
        {
          label: 'Vehicle',
          value: vehicleMap.get(selectedTrip.vehicle_id) ?? selectedTrip.vehicle_id,
        },
        {
          label: 'Driver',
          value: driverMap.get(selectedTrip.driver_id) ?? selectedTrip.driver_id,
        },
        {
          label: 'Cargo Weight',
          value: selectedTrip.cargo_weight != null ? formatNumber(selectedTrip.cargo_weight) + ' kg' : '—',
        },
        {
          label: 'Planned Distance',
          value: selectedTrip.planned_distance != null ? formatNumber(selectedTrip.planned_distance) + ' km' : '—',
        },
        {
          label: 'Actual Distance',
          value: selectedTrip.actual_distance != null ? formatNumber(selectedTrip.actual_distance) + ' km' : '—',
        },
        { label: 'Status', value: renderTripStatus(selectedTrip.status) },
        { label: 'Dispatched At', value: formatDateTime(selectedTrip.dispatched_at) },
        { label: 'Completed At', value: formatDateTime(selectedTrip.completed_at) },
        {
          label: 'Final Odometer',
          value: selectedTrip.final_odometer != null ? formatNumber(selectedTrip.final_odometer) + ' km' : '—',
        },
        {
          label: 'Fuel Consumed',
          value: selectedTrip.fuel_consumed != null ? formatNumber(selectedTrip.fuel_consumed) + ' L' : '—',
        },
        {
          label: 'Revenue',
          value: selectedTrip.revenue != null ? formatCurrency(selectedTrip.revenue) : '—',
        },
        {
          label: 'Driver Earnings',
          value: selectedTrip.driver_earnings != null ? formatCurrency(selectedTrip.driver_earnings) : '—',
        },
        { label: 'Notes', value: selectedTrip.notes || '—' },
        { label: 'Created At', value: formatDateTime(selectedTrip.created_at) },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trips</h1>
        {isDispatcher && <Button onClick={openCreateModal}>Add Trip</Button>}
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Select
          label="Status"
          id="filter-status"
          options={tripStatusSelectOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          label="Vehicle"
          id="filter-vehicle"
          options={vehicleOptions}
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
        />
        <Select
          label="Driver"
          id="filter-driver"
          options={driverOptions}
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTrips}
        loading={loading}
        onRowClick={handleRowClick}
        emptyMessage="No trips found."
      />

      {/* Trip Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedTrip(null); }}
        title="Trip Detail"
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {detailFields.map((field) => (
            <div key={field.label} className="col-span-2 sm:col-span-1">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {field.label}
              </dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                {field.value}
              </dd>
            </div>
          ))}
        </div>
      </Modal>

      {/* Create Trip Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Trip"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <Input
            label="Source"
            id="trip-source"
            value={tripForm.source}
            onChange={(e) => setTripForm((f) => ({ ...f, source: e.target.value }))}
            required
          />
          <Input
            label="Destination"
            id="trip-destination"
            value={tripForm.destination}
            onChange={(e) => setTripForm((f) => ({ ...f, destination: e.target.value }))}
            required
          />
          <Select
            label="Vehicle"
            id="trip-vehicle"
            options={vehicleOptions}
            value={tripForm.vehicle_id}
            onChange={(e) => setTripForm((f) => ({ ...f, vehicle_id: e.target.value }))}
            required
          />
          <Select
            label="Driver"
            id="trip-driver"
            options={driverOptions}
            value={tripForm.driver_id}
            onChange={(e) => setTripForm((f) => ({ ...f, driver_id: e.target.value }))}
            required
          />
          <Input
            label="Cargo Weight (kg)"
            id="trip-cargo-weight"
            type="number"
            min={0}
            value={tripForm.cargo_weight ?? ''}
            onChange={(e) =>
              setTripForm((f) => ({
                ...f,
                cargo_weight: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Input
            label="Planned Distance (km)"
            id="trip-planned-distance"
            type="number"
            min={0}
            value={tripForm.planned_distance ?? ''}
            onChange={(e) =>
              setTripForm((f) => ({
                ...f,
                planned_distance: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Input
            label="Notes"
            id="trip-notes"
            value={tripForm.notes ?? ''}
            onChange={(e) => setTripForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        open={completeModalOpen}
        onClose={() => { setCompleteModalOpen(false); setCompletingTrip(null); }}
        title="Complete Trip"
        className="max-w-md"
      >
        <form onSubmit={handleCompleteTrip} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Completing trip from{' '}
            <span className="font-semibold">{completingTrip?.source}</span> to{' '}
            <span className="font-semibold">{completingTrip?.destination}</span>.
          </p>
          <Input
            label="Final Odometer (km)"
            id="complete-odometer"
            type="number"
            min={0}
            value={String(completeForm.final_odometer)}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, final_odometer: Number(e.target.value) }))
            }
            required
          />
          <Input
            label="Fuel Consumed (L)"
            id="complete-fuel"
            type="number"
            min={0}
            step="0.1"
            value={String(completeForm.fuel_consumed)}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, fuel_consumed: Number(e.target.value) }))
            }
            required
          />
          <Input
            label="Revenue ($)"
            id="complete-revenue"
            type="number"
            min={0}
            step="0.01"
            value={String(completeForm.revenue)}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, revenue: Number(e.target.value) }))
            }
            required
          />
          <Input
            label="Driver Earnings ($)"
            id="complete-driver-earnings"
            type="number"
            min={0}
            step="0.01"
            value={String(completeForm.driver_earnings)}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, driver_earnings: Number(e.target.value) }))
            }
            required
          />
          <Input
            label="Actual Distance (km)"
            id="complete-actual-distance"
            type="number"
            min={0}
            step="0.1"
            value={String(completeForm.actual_distance)}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, actual_distance: Number(e.target.value) }))
            }
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setCompleteModalOpen(false); setCompletingTrip(null); }}
            >
              Cancel
            </Button>
            <Button type="submit">Complete Trip</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => { setCancelConfirmOpen(false); setCancellingTrip(null); }}
        onConfirm={handleCancelTrip}
        title="Cancel Trip"
        message={
          cancellingTrip
            ? `Are you sure you want to cancel the trip from "${cancellingTrip.source}" to "${cancellingTrip.destination}"?`
            : 'Are you sure you want to cancel this trip?'
        }
        confirmLabel="Cancel Trip"
        variant="danger"
      />
    </div>
  );
}
