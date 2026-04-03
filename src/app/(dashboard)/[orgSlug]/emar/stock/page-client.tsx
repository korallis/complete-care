'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  acknowledgeExpiryAlert,
  createMedicationStock,
  createReorderRequest,
  createStockBatch,
  notifyPharmacy,
  recordStockTransaction,
  updateReorderStatus,
} from '@/features/emar/stock/actions';
import type { ExpiryAlert } from '@/features/emar/stock/types';
import type { ControlledDrugStaffMember } from '@/features/emar/actions/controlled-drugs';

type StockItem = {
  id: string;
  medicationName: string;
  form: string;
  strength: string;
  currentQuantity: number;
  minimumThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  storageRequirement: string;
  isControlledDrug: boolean;
  controlledDrugSchedule: string | null;
  pharmacySupplier: string | null;
  lowStock: boolean;
  openReorders: number;
  batches: Array<{
    id: string;
    medicationStockId: string;
    batchNumber: string;
    expiryDate: string | Date;
    quantity: number;
    isExhausted: boolean;
    expiryAlertAcknowledged: boolean;
  }>;
};

type ReorderRow = {
  id: string;
  medicationStockId: string;
  medicationName: string;
  quantityRequested: number;
  quantityReceived: number | null;
  status: string;
  pharmacyNotified: boolean;
  pharmacyReference: string | null;
  expectedDeliveryDate: string | Date | null;
  createdAt: Date;
};

type TransactionRow = {
  id: string;
  medicationStockId: string;
  medicationName: string;
  transactionType: string;
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  sourceDestination: string | null;
  createdAt: Date;
};

interface StockDashboardPageClientProps {
  organisationId: string;
  currentUserId: string;
  canCreate: boolean;
  canManage: boolean;
  stockItems: StockItem[];
  expiryAlerts: ExpiryAlert[];
  reorders: ReorderRow[];
  recentTransactions: TransactionRow[];
  staffMembers: ControlledDrugStaffMember[];
}

type Notice = { tone: 'success' | 'error'; message: string } | null;

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400';
const labelClassName =
  'mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500';

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB');
}

function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StockDashboardPageClient({
  organisationId,
  currentUserId,
  canCreate,
  canManage,
  stockItems,
  expiryAlerts,
  reorders,
  recentTransactions,
  staffMembers,
}: StockDashboardPageClientProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [isPending, startTransition] = useTransition();

  const batchOptions = useMemo(
    () =>
      stockItems.flatMap((item) =>
        item.batches
          .filter((batch) => !batch.isExhausted)
          .map((batch) => ({
            id: batch.id,
            label: `${item.medicationName} · ${batch.batchNumber} (${batch.quantity})`,
          })),
      ),
    [stockItems],
  );

  function runAction(work: () => Promise<void>, successMessage: string) {
    setNotice(null);
    startTransition(async () => {
      try {
        await work();
        setNotice({ tone: 'success', message: successMessage });
        router.refresh();
      } catch (error) {
        setNotice({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Stock lines" value={stockItems.length} />
        <MetricCard
          label="Low stock"
          value={stockItems.filter((item) => item.lowStock).length}
        />
        <MetricCard
          label="Open reorders"
          value={reorders.filter((reorder) =>
            ['pending', 'approved', 'ordered', 'partially_received'].includes(reorder.status),
          ).length}
        />
        <MetricCard label="Expiry alerts" value={expiryAlerts.length} />
      </section>

      {canCreate ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await createMedicationStock(organisationId, currentUserId, {
                  medicationName: String(formData.get('medicationName') ?? ''),
                  medicationCode: optionalString(formData.get('medicationCode')),
                  form: String(formData.get('form') ?? 'tablet'),
                  strength: String(formData.get('strength') ?? ''),
                  currentQuantity: numberValue(formData.get('currentQuantity')),
                  minimumThreshold: numberValue(formData.get('minimumThreshold')),
                  reorderPoint: numberValue(formData.get('reorderPoint')),
                  reorderQuantity: numberValue(formData.get('reorderQuantity')),
                  unit: String(formData.get('unit') ?? 'tablets'),
                  storageRequirement: String(formData.get('storageRequirement') ?? 'room_temp'),
                  isControlledDrug: Boolean(formData.get('isControlledDrug')),
                  controlledDrugSchedule: optionalString(formData.get('controlledDrugSchedule')),
                  pharmacySupplier: optionalString(formData.get('pharmacySupplier')),
                });
                event.currentTarget.reset();
              }, 'Stock line created.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Add medication stock</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Medication name">
                <input name="medicationName" required className={inputClassName} />
              </Field>
              <Field label="Code">
                <input name="medicationCode" className={inputClassName} />
              </Field>
              <Field label="Form">
                <select name="form" defaultValue="tablet" className={inputClassName}>
                  {['tablet', 'capsule', 'liquid', 'cream', 'ointment', 'gel', 'inhaler', 'injection', 'patch', 'drops', 'suppository', 'spray', 'powder', 'lozenge', 'other'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Strength">
                <input name="strength" required className={inputClassName} />
              </Field>
              <Field label="Current quantity">
                <input name="currentQuantity" type="number" min="0" defaultValue="0" className={inputClassName} />
              </Field>
              <Field label="Unit">
                <select name="unit" defaultValue="tablets" className={inputClassName}>
                  {['tablets', 'capsules', 'ml', 'doses', 'patches', 'ampoules', 'sachets', 'units', 'grams', 'applications'].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Minimum threshold">
                <input name="minimumThreshold" type="number" min="0" defaultValue="0" className={inputClassName} />
              </Field>
              <Field label="Reorder point">
                <input name="reorderPoint" type="number" min="0" defaultValue="0" className={inputClassName} />
              </Field>
              <Field label="Reorder quantity">
                <input name="reorderQuantity" type="number" min="0" defaultValue="0" className={inputClassName} />
              </Field>
              <Field label="Storage">
                <select name="storageRequirement" defaultValue="room_temp" className={inputClassName}>
                  {['room_temp', 'refrigerated', 'controlled_drug_cabinet'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pharmacy supplier">
                <input name="pharmacySupplier" className={inputClassName} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="isControlledDrug" />
                Controlled drug
              </label>
              <Field label="CD schedule">
                <select name="controlledDrugSchedule" defaultValue="" className={inputClassName}>
                  <option value="">Not applicable</option>
                  {['schedule_2', 'schedule_3', 'schedule_4', 'schedule_5'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save stock line
            </button>
          </form>

          <div className="grid gap-6">
            <form
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runAction(async () => {
                  await createStockBatch(organisationId, currentUserId, {
                    medicationStockId: String(formData.get('medicationStockId') ?? ''),
                    batchNumber: String(formData.get('batchNumber') ?? ''),
                    expiryDate: String(formData.get('expiryDate') ?? ''),
                    quantity: numberValue(formData.get('quantity')),
                    expiryAlertDays: numberValue(formData.get('expiryAlertDays')),
                  });
                  event.currentTarget.reset();
                }, 'Batch added to stock.');
              }}
            >
              <h2 className="text-base font-semibold text-slate-900">Add batch</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Medication">
                  <select name="medicationStockId" required className={inputClassName}>
                    <option value="">Select stock item</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.medicationName} · {item.strength}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Batch number">
                  <input name="batchNumber" required className={inputClassName} />
                </Field>
                <Field label="Expiry date">
                  <input name="expiryDate" type="date" required className={inputClassName} />
                </Field>
                <Field label="Quantity">
                  <input name="quantity" type="number" min="1" defaultValue="1" required className={inputClassName} />
                </Field>
                <Field label="Alert days">
                  <input name="expiryAlertDays" type="number" min="1" max="365" defaultValue="30" className={inputClassName} />
                </Field>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Save batch
              </button>
            </form>

            <form
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runAction(async () => {
                  await recordStockTransaction(organisationId, currentUserId, {
                    medicationStockId: String(formData.get('medicationStockId') ?? ''),
                    stockBatchId: optionalString(formData.get('stockBatchId')),
                    transactionType: String(formData.get('transactionType') ?? 'receipt'),
                    quantity: numberValue(formData.get('quantity')),
                    witnessedById: optionalString(formData.get('witnessedById')),
                    reason: optionalString(formData.get('reason')),
                    notes: optionalString(formData.get('notes')),
                    sourceDestination: optionalString(formData.get('sourceDestination')),
                  });
                  event.currentTarget.reset();
                }, 'Stock transaction recorded.');
              }}
            >
              <h2 className="text-base font-semibold text-slate-900">Record transaction</h2>
              <p className="mt-1 text-xs text-slate-500">
                Controlled-drug stock transactions require a second witness.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Medication">
                  <select name="medicationStockId" required className={inputClassName}>
                    <option value="">Select stock item</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.medicationName} · {item.strength}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Batch">
                  <select name="stockBatchId" defaultValue="" className={inputClassName}>
                    <option value="">Organisation-level adjustment</option>
                    {batchOptions.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Transaction type">
                  <select name="transactionType" defaultValue="receipt" className={inputClassName}>
                    {['receipt', 'issue', 'adjustment', 'return', 'disposal'].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input name="quantity" type="number" required className={inputClassName} />
                </Field>
                <Field label="Witness">
                  <select name="witnessedById" defaultValue="" className={inputClassName}>
                    <option value="">No witness</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Source / destination">
                  <input name="sourceDestination" className={inputClassName} />
                </Field>
                <Field label="Reason">
                  <input name="reason" className={inputClassName} />
                </Field>
                <Field label="Notes">
                  <textarea name="notes" rows={3} className={inputClassName} />
                </Field>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Save transaction
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Stock overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/70 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Reorder</th>
                <th className="px-4 py-3">Batches</th>
                <th className="px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No stock records yet.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.medicationName}</div>
                      <div className="text-xs text-slate-500">
                        {item.strength} · {item.form}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.currentQuantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.reorderPoint}/{item.reorderQuantity}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.batches.length}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.lowStock ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                            Low stock
                          </span>
                        ) : null}
                        {item.openReorders > 0 ? (
                          <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
                            {item.openReorders} reorder
                            {item.openReorders === 1 ? '' : 's'}
                          </span>
                        ) : null}
                        {item.isControlledDrug ? (
                          <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800">
                            Controlled drug
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Reorders</h2>
          </div>
          <div className="space-y-4 p-6">
            {canCreate ? (
              <form
                className="grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  runAction(async () => {
                    await createReorderRequest(organisationId, currentUserId, {
                      medicationStockId: String(formData.get('medicationStockId') ?? ''),
                      quantityRequested: numberValue(formData.get('quantityRequested')),
                      notes: optionalString(formData.get('notes')),
                    });
                    event.currentTarget.reset();
                  }, 'Reorder request created.');
                }}
              >
                <Field label="Medication">
                  <select name="medicationStockId" required className={inputClassName}>
                    <option value="">Select stock item</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.medicationName} · {item.strength}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity requested">
                  <input name="quantityRequested" type="number" min="1" required className={inputClassName} />
                </Field>
                <Field label="Notes">
                  <input name="notes" className={inputClassName} />
                </Field>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Create reorder
                  </button>
                </div>
              </form>
            ) : null}
            {reorders.length === 0 ? (
              <p className="text-sm text-slate-500">No reorder requests recorded.</p>
            ) : (
              reorders.map((reorder) => (
                <div key={reorder.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{reorder.medicationName}</div>
                      <div className="text-xs text-slate-500">
                        Raised {formatDateTime(reorder.createdAt)}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {reorder.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Requested {reorder.quantityRequested}
                    {reorder.quantityReceived ? ` · Received ${reorder.quantityReceived}` : ''}
                    {reorder.expectedDeliveryDate
                      ? ` · Expected ${formatDate(reorder.expectedDeliveryDate)}`
                      : ''}
                  </div>
                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <select
                        defaultValue={reorder.status}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        onChange={(event) =>
                          runAction(
                            async () => {
                              await updateReorderStatus(organisationId, reorder.id, currentUserId, {
                                status: event.target.value as
                                  | 'pending'
                                  | 'approved'
                                  | 'ordered'
                                  | 'partially_received'
                                  | 'received'
                                  | 'cancelled',
                                quantityReceived:
                                  event.target.value === 'received'
                                    ? reorder.quantityRequested
                                    : undefined,
                              });
                            },
                            'Reorder status updated.',
                          )
                        }
                      >
                        {['pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'].map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                      {!reorder.pharmacyNotified ? (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              async () => {
                                await notifyPharmacy(organisationId, reorder.id, currentUserId);
                              },
                              'Pharmacy notification logged.',
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Mark pharmacy notified
                        </button>
                      ) : (
                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          Pharmacy notified
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Expiry alerts</h2>
            </div>
            <div className="space-y-3 p-6">
              {expiryAlerts.length === 0 ? (
                <p className="text-sm text-slate-500">No active expiry alerts.</p>
              ) : (
                expiryAlerts.map((alert) => (
                  <div key={alert.batchId} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{alert.medicationName}</div>
                        <div className="text-xs text-slate-500">
                          Batch {alert.batchNumber} · expires {formatDate(alert.expiryDate)}
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        {alert.isExpired ? 'Expired' : `${alert.daysUntilExpiry} day(s) left`}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Quantity remaining: {alert.quantity}
                    </div>
                    {canManage && !alert.isAcknowledged ? (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            async () => {
                              await acknowledgeExpiryAlert(
                                organisationId,
                                alert.batchId,
                                currentUserId,
                              );
                            },
                            'Expiry alert acknowledged.',
                          )
                        }
                        className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Acknowledge alert
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
            </div>
            <div className="space-y-3 p-6">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-slate-500">No stock movements logged yet.</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {transaction.medicationName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {transaction.transactionType} · {formatDateTime(transaction.createdAt)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-700">
                        <div className="font-semibold">{transaction.quantity}</div>
                        <div className="text-xs text-slate-500">
                          Balance {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                    {transaction.reason || transaction.sourceDestination ? (
                      <div className="mt-2 text-sm text-slate-600">
                        {[transaction.reason, transaction.sourceDestination]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : undefined;
}

function numberValue(value: FormDataEntryValue | null) {
  return Number(String(value ?? '0'));
}
