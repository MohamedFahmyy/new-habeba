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

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <span className="text-white font-medium text-sm block">{label}</span>
        {description && <p className="text-white/40 text-xs leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        dir="ltr"
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-white/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsTab() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then(r => r.data.settings),
  });
  const [form, setForm] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateSettings({ ...data, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success(isAr ? 'تم حفظ الإعدادات بنجاح! ✨' : 'Settings saved successfully! ✨');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (isAr ? 'فشل حفظ الإعدادات' : 'Failed to save settings'));
    },
  });

  const getFieldValue = (key: string): string => {
    if (form[key] !== undefined) return form[key];
    return (data as any)?.[key] ?? '';
  };

  const isFieldChecked = (key: string, defaultVal: string = '0'): boolean => {
    const val = getFieldValue(key);
    return val === '1' || (!val && defaultVal === '1');
  };

  // Instant toggle for master payment switch
  const handleTogglePaymentMaster = async () => {
    const current = isFieldChecked('payments_enabled', '0');
    const nextVal = current ? '0' : '1';
    setForm(f => ({ ...f, payments_enabled: nextVal }));
    try {
      await adminApi.updateSettings({ payments_enabled: nextVal as '0' | '1' });
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['payment-settings'] });
      if (nextVal === '1') {
        toast.success(isAr ? 'تم تفعيل بوابة الدفع! المنصة الآن مدفوعة 💳' : 'Payment Gate Enabled! Platform is now monetized.');
      } else {
        toast.success(isAr ? 'تم تعطيل الدفع! المنصة الآن مجانية بالكامل للجميع 🎁' : 'Payment Gate Disabled! Platform is now 100% free.');
      }
    } catch {
      toast.error(isAr ? 'تعذر تحديث حالة الدفع' : 'Failed to toggle payment state');
    }
  };

  const toggleLocalField = (key: string) => {
    const current = isFieldChecked(key, '0');
    setForm(f => ({ ...f, [key]: current ? '0' : '1' }));
  };

  if (isLoading || !data) {
    return <div className="text-white/50 p-6">{isAr ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</div>;
  }

  const isPaymentsActive = isFieldChecked('payments_enabled', '0');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{isAr ? 'إعدادات المنصة والدفع' : t('adm_nav_settings')}</h2>
          <p className="text-white/50 text-sm mt-1">
            {isAr ? 'التحكم في تفعيل أو تعطيل الدفع، وأسعار الهدايا، وبيانات التحويل.' : 'Manage payment gate activation, pricing, and payout accounts.'}
          </p>
        </div>
      </div>

      {/* MASTER PAYMENT GATE CONTROL CARD */}
      <div
        className={`glass-card p-6 border-2 transition-all relative overflow-hidden ${
          isPaymentsActive
            ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-black/40 to-black/60 shadow-lg shadow-emerald-500/5'
            : 'border-white/10 bg-gradient-to-br from-white/5 via-black/40 to-black/60'
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">💳</span>
              <h3 className="text-white font-bold text-lg">
                {isAr ? 'بوابة ونظام الدفع (Payment Gateway)' : 'Payment Gate Master Switch'}
              </h3>
            </div>
            <p className="text-white/60 text-xs sm:text-sm max-w-lg leading-relaxed">
              {isAr
                ? 'تحكم كامل في جعل المنصة مدفوعة (تتطلب تحويل بنكي لتفعيل ونشر الهدية) أو مجانية بالكامل لأي شخص.'
                : 'Turn payments ON to charge for gifts, or OFF to let all users create and publish completely free.'}
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="flex items-center gap-2">
            {isPaymentsActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isAr ? 'الدفع مفعّل (المنصة مدفوعة)' : 'Payments Enabled (Paid)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                {isAr ? 'الدفع معطّل (المنصة مجانية 100%)' : 'Payments Disabled (Free)'}
              </span>
            )}
          </div>
        </div>

        {/* Master Switch Component */}
        <div className="pt-4">
          <ToggleSetting
            label={isAr ? 'تفعيل الدفع الإلزامي لنشر الهدايا' : 'Require Payment to Publish Gifts'}
            description={
              isPaymentsActive
                ? (isAr
                    ? 'الوضع الحالي: لن يتمكن العميل من تفعيل الرابط العام إلا بعد إتمام الدفع وتأكيد الإيصال.'
                    : 'Active: Gifts stay draft/unpaid until customer submits payment and admin approves.')
                : (isAr
                    ? 'الوضع الحالي: المنصة مجانية، يمكن لأي مستخدم إنشاء ونشر هداياه فوراً دون دفع أي مبالغ.'
                    : 'Inactive: Free mode! All gifts publish immediately with zero checkout required.')
            }
            checked={isPaymentsActive}
            onChange={handleTogglePaymentMaster}
          />
        </div>
      </div>

      {/* PRICING & CURRENCY */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>💰</span>
          <span>{isAr ? 'تسعير الهدية' : 'Gift Pricing'}</span>
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">{isAr ? 'سعر التفعيل للهدية الواحدة' : 'Activation Price'}</label>
            <input
              type="number"
              value={getFieldValue('payment_price') || '149'}
              onChange={e => setForm(f => ({ ...f, payment_price: e.target.value }))}
              className="input-field"
              placeholder="149"
            />
          </div>
          <div>
            <label className="label-text">{isAr ? 'العملة' : 'Currency'}</label>
            <input
              type="text"
              value={getFieldValue('payment_currency') || 'EGP'}
              onChange={e => setForm(f => ({ ...f, payment_currency: e.target.value }))}
              className="input-field"
              placeholder="EGP"
            />
          </div>
        </div>
      </div>

      {/* INSTAPAY SETTINGS */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span>{isAr ? 'طريقة الدفع: انستاباي (InstaPay)' : 'InstaPay Settings'}</span>
          </h3>
          <span className={`text-xs px-2.5 py-0.5 rounded-full ${isFieldChecked('instapay_enabled', '1') ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-white/40'}`}>
            {isFieldChecked('instapay_enabled', '1') ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Disabled')}
          </span>
        </div>

        <ToggleSetting
          label={isAr ? 'إتاحة الدفع عبر انستاباي' : 'Enable InstaPay Payment'}
          description={isAr ? 'إظهار خيار انستاباي في صفحة الدفع للعملاء' : 'Show InstaPay option in checkout'}
          checked={isFieldChecked('instapay_enabled', '1')}
          onChange={() => toggleLocalField('instapay_enabled')}
        />

        <div>
          <label className="label-text">{isAr ? 'عنوان انستاباي (IPA / Username)' : 'InstaPay Address (IPA / Username)'}</label>
          <input
            value={getFieldValue('instapay_address')}
            onChange={e => setForm(f => ({ ...f, instapay_address: e.target.value }))}
            className="input-field"
            placeholder="example@instapay"
          />
        </div>

        <div>
          <label className="label-text">{isAr ? 'تعليمات التحويل للعميل' : 'Customer Transfer Instructions'}</label>
          <textarea
            value={getFieldValue('instapay_instructions')}
            onChange={e => setForm(f => ({ ...f, instapay_instructions: e.target.value }))}
            className="input-field min-h-20 resize-none text-sm"
            placeholder={isAr ? 'مثال: يرجى كتابة اسمك في وصف المعاملة ورفع لقطة الشاشة للإيصال.' : 'Instructions shown on checkout...'}
          />
        </div>
      </div>

      {/* VODAFONE CASH SETTINGS */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>📱</span>
            <span>{isAr ? 'طريقة الدفع: فودافون كاش (Vodafone Cash)' : 'Vodafone Cash Settings'}</span>
          </h3>
          <span className={`text-xs px-2.5 py-0.5 rounded-full ${isFieldChecked('vodafone_cash_enabled', '1') ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-white/40'}`}>
            {isFieldChecked('vodafone_cash_enabled', '1') ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Disabled')}
          </span>
        </div>

        <ToggleSetting
          label={isAr ? 'إتاحة الدفع عبر فودافون كاش' : 'Enable Vodafone Cash Payment'}
          description={isAr ? 'إظهار خيار فودافون كاش في صفحة الدفع للعملاء' : 'Show Vodafone Cash option in checkout'}
          checked={isFieldChecked('vodafone_cash_enabled', '1')}
          onChange={() => toggleLocalField('vodafone_cash_enabled')}
        />

        <div>
          <label className="label-text">{isAr ? 'رقم محفظة فودافون كاش' : 'Vodafone Cash Wallet Number'}</label>
          <input
            value={getFieldValue('vodafone_cash_number')}
            onChange={e => setForm(f => ({ ...f, vodafone_cash_number: e.target.value }))}
            className="input-field"
            placeholder="010xxxxxxxx"
          />
        </div>

        <div>
          <label className="label-text">{isAr ? 'تعليمات التحويل للعميل' : 'Customer Transfer Instructions'}</label>
          <textarea
            value={getFieldValue('vodafone_cash_instructions')}
            onChange={e => setForm(f => ({ ...f, vodafone_cash_instructions: e.target.value }))}
            className="input-field min-h-20 resize-none text-sm"
            placeholder={isAr ? 'مثال: يرجى التحويل على رقم المحفظة الموضح وإدخال رقم هاتفك للتحقق.' : 'Instructions shown on checkout...'}
          />
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="pt-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary w-full py-4 text-base font-semibold shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2"
        >
          {updateMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>💾</span>
          )}
          <span>{updateMutation.isPending ? t('loading') : (isAr ? 'حفظ كافة إعدادات المنصة' : t('adm_save_settings'))}</span>
        </button>
      </div>
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
