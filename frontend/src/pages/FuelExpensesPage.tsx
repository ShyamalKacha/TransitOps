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
import type { FuelLog, FuelLogCreate, Expense, ExpenseCreate } from '../types';
import api from '../api/client';

export function FuelExpensesPage() {
  const { fuelLogs, expenses, fuelLoading, expenseLoading, fetchFuelLogs, fetchExpenses, createFuelLog, createExpense } = useFuelExpenseStore();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel');
  const [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [fuelForm, setFuelForm] = useState<FuelLogCreate>({
    vehicle_id: '', liters: 0, cost_per_liter: 0, date: '', notes: '',
  });
  const [expenseForm, setExpenseForm] = useState<ExpenseCreate>({
    vehicle_id: '', type: 'other', amount: 0, description: '', date: '',
  });

  useEffect(() => { fetchFuelLogs(); fetchExpenses(); }, []);
  useEffect(() => {
    api.get('/vehicles').then(({ data }) => setVehicles((data.data ?? data).map((v: any) => ({ id: v.id, name: v.registration_number }))));
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
            {canEdit && <Button onClick={() => setShowFuelModal(true)}>Add Fuel Log</Button>}
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
          <Select id="fv" label="Vehicle" value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
            options={vehicles.map((v) => ({ value: v.id, label: v.name }))} showAllOption={false} />
          <Input id="fl" label="Liters" type="number" step="0.01" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })} />
          <Input id="fcpl" label="Cost per Liter" type="number" step="0.01" value={fuelForm.cost_per_liter} onChange={(e) => setFuelForm({ ...fuelForm, cost_per_liter: Number(e.target.value) })} />
          <Input id="fd" label="Date" type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
          <Input id="fn" label="Notes" value={fuelForm.notes} onChange={(e) => setFuelForm({ ...fuelForm, notes: e.target.value })} />
          <Button className="w-full" onClick={async () => {
            try {
              await createFuelLog(fuelForm);
              setShowFuelModal(false);
              setFuelForm({ vehicle_id: '', liters: 0, cost_per_liter: 0, date: '', notes: '' });
              fetchFuelLogs();
            } catch (e: any) {
              alert(e?.response?.data?.detail || 'Failed to create fuel log');
            }
          }}>Create</Button>
        </div>
      </Modal>

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <div className="space-y-3">
          <Select id="ev" label="Vehicle" value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
            options={vehicles.map((v) => ({ value: v.id, label: v.name }))} showAllOption={false} />
          <Select id="et" label="Type" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as any })}
            options={[{ value: 'toll', label: 'Toll' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'other', label: 'Other' }]} />
          <Input id="ea" label="Amount" type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} />
          <Input id="ed" label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          <Input id="edate" label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
          <Button className="w-full" onClick={async () => {
            try {
              await createExpense(expenseForm);
              setShowExpenseModal(false);
              setExpenseForm({ vehicle_id: '', type: 'other', amount: 0, description: '', date: '' });
              fetchExpenses();
            } catch (e: any) {
              alert(e?.response?.data?.detail || 'Failed to create expense');
            }
          }}>Create</Button>
        </div>
      </Modal>
    </div>
  );
}
