import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Users, Gift, CreditCard, Settings, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import type { Payment } from '../../types';

type AdminTab = 'stats' | 'users' | 'gifts' | 'payments' | 'settings';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="glass-card p-6">
      <Icon className={`w-8 h-8 ${color} mb-3`} />
      <div className="text-3xl font-bold text-white mb-1">{value ?? 0}</div>
      <div className="text-white/40 text-sm">{label}</div>
    </div>
  );
}

function StatsTab() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminApi.stats().then(r => r.data.stats) });
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <StatCard label={t('adm_stat_users') ?? 'Users'} value={data.totalUsers} icon={Users} color="text-pink-400" />
      <StatCard label={t('adm_stat_gifts') ?? 'Gifts'} value={data.totalGifts} icon={Gift} color="text-blue-400" />
      <StatCard label="Published" value={data.totalPublished} icon={CheckCircle} color="text-green-400" />
      <StatCard label={t('adm_stat_pending_pay') ?? 'Pending'} value={data.pendingPayments} icon={CreditCard} color="text-yellow-400" />
    </div>
  );
}

function PaymentsTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => adminApi.payments().then(r => r.data.payments),
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approvePayment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment approved & gift published!'); },
    onError: () => toast.error('Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: (id: number) => adminApi.rejectPayment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment rejected.'); },
    onError: () => toast.error('Failed to reject'),
  });

  if (isLoading) return <div className="text-white/50 p-6">Loading...</div>;

  const pending = (data ?? []).filter((p: Payment) => p.status === 'awaiting_review');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">{t('adm_nav_payments')} ({pending.length} pending)</h2>
      {pending.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/40">No pending payments</div>
      ) : (
        pending.map((payment: Payment & { user?: any; gift?: any }) => (
          <div key={payment.id} className="glass-card p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-semibold">Payment #{payment.id}</p>
              <p className="text-white/50 text-sm">
                {payment.user?.email ?? `User ${payment.userId}`} · {payment.provider} · {payment.amount} {payment.currency}
              </p>
              {payment.transactionReference && (
                <p className="text-white/40 text-xs mt-1">Ref: {payment.transactionReference}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => approve.mutate(payment.id)} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {t('adm_action_approve')}
              </button>
              <button onClick={() => reject.mutate(payment.id)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5 text-red-400 border-red-500/20">
                <XCircle className="w-4 h-4" /> {t('adm_action_reject')}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SettingsTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => adminApi.getSettings().then(r => r.data.settings) });
  const [form, setForm] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: () => adminApi.updateSettings({ ...data, ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); toast.success('Settings saved!'); },
    onError: () => toast.error('Failed to save'),
  });

  const settings = { ...data, ...form };

  const toggleField = (key: string) =>
    setForm(f => ({ ...f, [key]: f[key] === '1' || settings[key as keyof typeof settings] === '1' ? '0' : '1' }));

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-white">{t('adm_nav_settings')}</h2>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold">Payment Gate</h3>
        <ToggleSetting
          label="Require Payment to Publish"
          checked={settings.payments_enabled === '1'}
          onChange={() => toggleField('payments_enabled')}
        />
        <div>
          <label className="label-text">Activation Price (EGP)</label>
          <input
            type="number"
            value={settings.payment_price ?? '149'}
            onChange={e => setForm(f => ({ ...f, payment_price: e.target.value }))}
            className="input-field max-w-xs"
          />
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold">InstaPay</h3>
        <ToggleSetting label="Enable InstaPay" checked={settings.instapay_enabled === '1'} onChange={() => toggleField('instapay_enabled')} />
        <div>
          <label className="label-text">InstaPay Address</label>
          <input
            value={settings.instapay_address ?? ''}
            onChange={e => setForm(f => ({ ...f, instapay_address: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold">Vodafone Cash</h3>
        <ToggleSetting label="Enable Vodafone Cash" checked={settings.vodafone_cash_enabled === '1'} onChange={() => toggleField('vodafone_cash_enabled')} />
        <div>
          <label className="label-text">Vodafone Cash Number</label>
          <input
            value={settings.vodafone_cash_number ?? ''}
            onChange={e => setForm(f => ({ ...f, vodafone_cash_number: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>

      <button onClick={() => update.mutate()} className="btn-primary">
        {t('adm_save_settings')}
      </button>
    </div>
  );
}

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70 text-sm">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-all ${checked ? 'bg-pink-500' : 'bg-white/10'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AdminTab>('stats');

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'stats', label: t('adm_nav_stats'), icon: BarChart2 },
    { id: 'payments', label: t('adm_nav_payments'), icon: CreditCard },
    { id: 'settings', label: t('adm_nav_settings'), icon: Settings },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">{t('adm_title')}</h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' && <StatsTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}
