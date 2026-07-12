import { useEffect, useState } from 'react';
import { useFuelExpenseStore } from '../stores/fuelExpenseStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Column } from '../components/ui/DataTable';
import type { FuelLog, Expense } from '../types';
import api from '../api/client';

export function FuelExpensesPage() {
  const { fuelLogs, expenses, fuelLoading, expenseLoading, fetchFuelLogs, fetchExpenses, createFuelLog, createExpense } = useFuelExpenseStore();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel');
  const [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [fuelError, setFuelError] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [vehiclesError, setVehiclesError] = useState('');
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '', liters: '', cost_per_liter: '', date: '', notes: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '', type: 'other', amount: '', description: '', date: '',
  });

  // Resolve user input (registration number or UUID) to a vehicle UUID
  const resolveVehicleId = (input: string): string | null => {
    if (!input) return null;
    // Already a UUID — use as-is
    if (/^[0-9a-f-]+$/i.test(input) && input.length === 36) return input;
    // Look up by registration number (case-insensitive)
    const match = vehicles.find((v) => v.name.toLowerCase() === input.toLowerCase());
    return match ? match.id : null;
  };

  useEffect(() => { fetchFuelLogs(); fetchExpenses(); }, []);
  useEffect(() => {
    setVehiclesLoading(true);
    setVehiclesError('');
    api.get('/vehicles').then(({ data }) => {
      const list = (data.data ?? data) as any[];
      if (list.length === 0) {
        setVehiclesError('No vehicles found. Please add a vehicle first.');
      }
      setVehicles(list.map((v: any) => ({ id: String(v.id), name: v.registration_number })));
    }).catch((err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to load vehicles';
      setVehiclesError(msg);
    }).finally(() => setVehiclesLoading(false));
  }, []);

  const fuelColumns: Column<FuelLog>[] = [
    { key: 'vehicle_id', header: 'Vehicle' },
    { key: 'liters', header: 'Liters', render: (r) => r.liters.toFixed(2) },
    { key: 'cost_per_liter', header: 'Cost/L', render: (r) => formatCurrency(r.cost_per_liter) },
    { key: 'total_cost', header: 'Total', render: (r) => formatCurrency(r.total_cost) },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: 'vehicle_id', header: 'Vehicle' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Fuel & Expenses</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'fuel' ? 'primary' : 'secondary'} onClick={() => setTab('fuel')}>Fuel Logs</Button>
        <Button variant={tab === 'expenses' ? 'primary' : 'secondary'} onClick={() => setTab('expenses')}>Expenses</Button>
      </div>

      {tab === 'fuel' && (
        <>
          <div className="flex justify-end mb-4">
            {canEdit && <Button onClick={() => setShowFuelModal(true)} disabled={vehicles.length === 0 && !vehiclesLoading}>Add Fuel Log</Button>}
          </div>
          <DataTable columns={fuelColumns} data={fuelLogs} loading={fuelLoading} />
        </>
      )}

      {tab === 'expenses' && (
        <>
          <div className="flex justify-end mb-4">
            {canEdit && <Button onClick={() => setShowExpenseModal(true)}>Add Expense</Button>}
          </div>
          <DataTable columns={expenseColumns} data={expenses} loading={expenseLoading} />
        </>
      )}

      <Modal open={showFuelModal} onClose={() => setShowFuelModal(false)} title="Add Fuel Log">
        <div className="space-y-3">
          <Input id="fv" label="Vehicle (registration number)" placeholder="e.g. ABC-1234" value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} />
          {vehiclesError && <p className="text-sm text-amber-600 dark:text-amber-400">{vehiclesError}</p>}
          <Input id="fl" label="Liters" type="number" step="0.01" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
          <Input id="fcpl" label="Cost per Liter" type="number" step="0.01" value={fuelForm.cost_per_liter} onChange={(e) => setFuelForm({ ...fuelForm, cost_per_liter: e.target.value })} />
          <Input id="fd" label="Date" type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
          <Input id="fn" label="Notes" value={fuelForm.notes} onChange={(e) => setFuelForm({ ...fuelForm, notes: e.target.value })} />
          {fuelError && <p className="text-sm text-red-600">{fuelError}</p>}
          <Button className="w-full" onClick={async () => {
            const missing = [];
            if (!fuelForm.vehicle_id) missing.push('Vehicle');
            if (!fuelForm.liters) missing.push('Liters');
            if (!fuelForm.cost_per_liter) missing.push('Cost per Liter');
            if (!fuelForm.date) missing.push('Date');
            if (missing.length > 0) {
              setFuelError(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required`);
              return;
            }
            // Resolve registration number → vehicle UUID
            const resolvedId = resolveVehicleId(fuelForm.vehicle_id);
            if (!resolvedId) {
              setFuelError(`Vehicle "${fuelForm.vehicle_id}" not found. Please check the registration number.`);
              return;
            }
            setFuelError('');
            try {
              await createFuelLog({
                vehicle_id: resolvedId,
                liters: Number(fuelForm.liters),
                cost_per_liter: Number(fuelForm.cost_per_liter),
                date: fuelForm.date,
                notes: fuelForm.notes || undefined,
              });
              setShowFuelModal(false);
              setFuelForm({ vehicle_id: '', liters: '', cost_per_liter: '', date: '', notes: '' });
              fetchFuelLogs();
            } catch (e: any) {
              setFuelError(e?.response?.data?.detail || 'Failed to create fuel log');
            }
          }}>Create</Button>
        </div>
      </Modal>

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <div className="space-y-3">
          <Input id="ev" label="Vehicle (registration number)" placeholder="e.g. ABC-1234" value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} />
          {vehiclesError && <p className="text-sm text-amber-600 dark:text-amber-400">{vehiclesError}</p>}
          <Select id="et" label="Type" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as any })}
            options={[{ value: 'toll', label: 'Toll' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'other', label: 'Other' }]} />
          <Input id="ea" label="Amount" type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
          <Input id="ed" label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          <Input id="edate" label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
          {expenseError && <p className="text-sm text-red-600">{expenseError}</p>}
          <Button className="w-full" onClick={async () => {
            const missing = [];
            if (!expenseForm.vehicle_id) missing.push('Vehicle');
            if (!expenseForm.amount) missing.push('Amount');
            if (!expenseForm.date) missing.push('Date');
            if (missing.length > 0) {
              setExpenseError(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required`);
              return;
            }
            // Resolve registration number → vehicle UUID
            const resolvedId = resolveVehicleId(expenseForm.vehicle_id);
            if (!resolvedId) {
              setExpenseError(`Vehicle "${expenseForm.vehicle_id}" not found. Please check the registration number.`);
              return;
            }
            setExpenseError('');
            try {
              await createExpense({
                vehicle_id: resolvedId,
                type: expenseForm.type as any,
                amount: Number(expenseForm.amount),
                description: expenseForm.description || undefined,
                date: expenseForm.date,
              });
              setShowExpenseModal(false);
              setExpenseForm({ vehicle_id: '', type: 'other', amount: '', description: '', date: '' });
              fetchExpenses();
            } catch (e: any) {
              setExpenseError(e?.response?.data?.detail || 'Failed to create expense');
            }
          }}>Create</Button>
        </div>
      </Modal>
    </div>
  );
}
