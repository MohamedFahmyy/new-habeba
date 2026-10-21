import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart2, Users, Gift, CreditCard, Settings, CheckCircle, XCircle, Trash2,
  ExternalLink, Eye, X, Image as ImageIcon, Search, Calendar, User, FileText, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import type { Payment } from '../../types';

type AdminTab = 'stats' | 'users' | 'gifts' | 'payments' | 'settings';

function getReceiptUrl(receiptPath?: string): string | null {
  if (!receiptPath) return null;
  if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) return receiptPath;
  if (receiptPath.startsWith('/')) return receiptPath;
  return `/api/uploads/${receiptPath}`;
}

// ── 1. Statistics Tab ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="glass-card p-6">
      <Icon className={`w-8 h-8 ${color} mb-3`} />
      <div className="text-3xl font-bold text-white mb-1">{value ?? 0}</div>
      <div className="text-white/40 text-sm">{label}</div>
    </div>
  );
}

function StatsTab({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.stats().then(r => r.data.stats),
  });

  if (isLoading) return <div className="text-white/50 p-6">{isAr ? 'جاري تحميل الإحصائيات...' : 'Loading statistics...'}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label={t('adm_stat_users') ?? (isAr ? 'المستخدمين' : 'Users')} value={data.totalUsers} icon={Users} color="text-pink-400" />
        <StatCard label={t('adm_stat_gifts') ?? (isAr ? 'إجمالي الهدايا' : 'Gifts')} value={data.totalGifts} icon={Gift} color="text-blue-400" />
        <StatCard label={isAr ? 'الهدايا المنشورة' : 'Published'} value={data.totalPublished} icon={CheckCircle} color="text-green-400" />
        <StatCard label={t('adm_stat_pending_pay') ?? (isAr ? 'طلبات الدفع المعلقة' : 'Pending Payments')} value={data.pendingPayments} icon={CreditCard} color="text-yellow-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-400" />
            <span>{isAr ? 'مراجعة المدفوعات' : 'Payment Reviews'}</span>
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            {isAr
              ? `يوجد حالياً ${data.pendingPayments} طلب تحويل ينتظر المراجعة والتأكيد لتفعيل ونشر الهدايا للعملاء.`
              : `You have ${data.pendingPayments} pending payment transfer(s) awaiting verification.`}
          </p>
          <button
            onClick={() => onNavigate('payments')}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <span>{isAr ? 'الانتقال لطلبات الدفع' : 'View Pending Payments'}</span>
            <span>→</span>
          </button>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-pink-400" />
            <span>{isAr ? 'التحكم في البوابة' : 'Payment Gateway'}</span>
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            {isAr
              ? 'تفعيل أو إيقاف التحصيل الإلزامي، وتعديل أسعار تفعيل الهدايا وعناوين انستاباي وفودافون كاش.'
              : 'Toggle monetization, adjust activation pricing, and configure payout accounts.'}
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <span>{isAr ? 'إدارة إعدادات المنصة' : 'Configure Settings'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 2. Users Tab ─────────────────────────────────────────────────────────────
function UsersTab() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.users().then(r => r.data.users),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(isAr ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (isAr ? 'تعذر حذف المستخدم' : 'Failed to delete user'));
    },
  });

  if (isLoading) return <div className="text-white/50 p-6">{isAr ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</div>;

  const users = (data ?? []).filter((u: any) =>
    (u.email?.toLowerCase().includes(search.toLowerCase()) ||
     u.username?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">{isAr ? 'إدارة المستخدمين' : 'User Management'}</h2>
          <p className="text-white/50 text-xs mt-1">{isAr ? `إجمالي الحسابات المسجلة: ${data?.length || 0}` : `Total registered: ${data?.length || 0}`}</p>
        </div>
        <div className="relative min-w-64">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالبريد أو الاسم...' : 'Search by email or name...'}
            className="input-field ps-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-white/60">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">#</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'المستخدم' : 'User'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الدور' : 'Role'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الهدايا' : 'Gifts'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'تاريخ التسجيل' : 'Registered'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    {isAr ? 'لا يوجد مستخدمين مطابقين للبحث' : 'No users matching search'}
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-white/40">{u.id}</td>
                    <td className="py-3.5 px-4 text-white font-medium flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">
                        {u.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3.5 px-4 text-white/70">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/60">
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-white/60">{u._count?.gifts ?? 0}</td>
                    <td className="py-3.5 px-4 text-white/40 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(isAr ? `هل أنت متأكد من حذف المستخدم "${u.email}" وكافة هداياه؟` : `Delete user "${u.email}" and all gifts?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 3. Gifts Tab ─────────────────────────────────────────────────────────────
function GiftsTab() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'gifts'],
    queryFn: () => adminApi.gifts().then(r => r.data.gifts),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(isAr ? 'تم حذف الهدية بنجاح' : 'Gift deleted successfully');
    },
    onError: () => toast.error(isAr ? 'تعذر حذف الهدية' : 'Failed to delete gift'),
  });

  if (isLoading) return <div className="text-white/50 p-6">{isAr ? 'جاري تحميل الهدايا...' : 'Loading gifts...'}</div>;

  const gifts = (data ?? []).filter((g: any) =>
    (g.title?.toLowerCase().includes(search.toLowerCase()) ||
     g.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
     g.senderName?.toLowerCase().includes(search.toLowerCase()) ||
     g.user?.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">{isAr ? 'كافة الهدايا والمواقع' : 'All Gift Websites'}</h2>
          <p className="text-white/50 text-xs mt-1">{isAr ? `إجمالي الهدايا: ${data?.length || 0}` : `Total gifts: ${data?.length || 0}`}</p>
        </div>
        <div className="relative min-w-64">
          <Search className="w-4 h-4 text-white/40 absolute start-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالعنوان أو صاحب الهدية...' : 'Search by title, owner...'}
            className="input-field ps-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {gifts.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/40">
            {isAr ? 'لا توجد هدايا مطابقة للبحث' : 'No gifts found'}
          </div>
        ) : (
          gifts.map((gift: any) => (
            <div key={gift.id} className="glass-card p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold text-base">{gift.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    gift.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {gift.status === 'published' ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    gift.paymentStatus === 'paid' ? 'bg-purple-500/20 text-purple-300' :
                    gift.paymentStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/60'
                  }`}>
                    {gift.paymentStatus === 'paid' ? (isAr ? 'مدفوع' : 'Paid') :
                     gift.paymentStatus === 'pending' ? (isAr ? 'بانتظار التأكيد' : 'Reviewing') : (isAr ? 'مجاني/غير مدفوع' : 'Free/Unpaid')}
                  </span>
                </div>
                <p className="text-white/50 text-xs">
                  <span>{isAr ? 'من: ' : 'From: '}{gift.senderName}</span>
                  <span className="mx-1.5">·</span>
                  <span>{isAr ? 'إلى: ' : 'To: '}{gift.recipientName}</span>
                  <span className="mx-1.5">·</span>
                  <span>{isAr ? 'المالك: ' : 'Owner: '}{gift.user?.email || 'Guest'}</span>
                  <span className="mx-1.5">·</span>
                  <span>{gift._count?.memories ?? 0} {isAr ? 'صور' : 'photos'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/gift/${gift.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'معاينة الموقع' : 'Open Gift'}</span>
                </a>
                <button
                  onClick={() => {
                    if (confirm(isAr ? `حذف الهدية "${gift.title}" نهائياً؟` : `Permanently delete "${gift.title}"?`)) {
                      deleteMutation.mutate(gift.id);
                    }
                  }}
                  className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title={isAr ? 'حذف الهدية' : 'Delete gift'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 4. Payments Tab (With Receipt Lightbox) ──────────────────────────────────
function PaymentsTab() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'awaiting_review' | 'approved' | 'rejected'>('awaiting_review');
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => adminApi.payments().then(r => r.data.payments),
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approvePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(isAr ? 'تمت الموافقة وتفعيل الهدية للنشر بنجاح! 🎉' : 'Payment approved & gift published!');
    },
    onError: () => toast.error(isAr ? 'فشلت عملية الموافقة' : 'Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: (id: number) => adminApi.rejectPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(isAr ? 'تم رفض التحويل.' : 'Payment rejected.');
    },
    onError: () => toast.error(isAr ? 'فشلت عملية الرفض' : 'Failed to reject'),
  });

  if (isLoading) return <div className="text-white/50 p-6">{isAr ? 'جاري تحميل سجلات الدفع...' : 'Loading payments...'}</div>;

  const allPayments = (data ?? []) as (Payment & { user?: any; gift?: any })[];
  const filtered = filter === 'all' ? allPayments : allPayments.filter(p => p.status === filter);
  const pendingCount = allPayments.filter(p => p.status === 'awaiting_review').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{t('adm_nav_payments')}</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {pendingCount} {isAr ? 'بانتظار المراجعة' : 'pending'}
              </span>
            )}
          </h2>
          <p className="text-white/50 text-xs mt-1">
            {isAr
              ? 'مراجعة إيصالات التحويل البنكي وتأكيد المعاملات لتفعيل هدايا العملاء.'
              : 'Inspect transfer receipts and approve payments to publish gifts.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter('awaiting_review')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'awaiting_review' ? 'bg-pink-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {isAr ? 'قيد المراجعة' : 'Pending'} ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'approved' ? 'bg-pink-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {isAr ? 'المقبولة' : 'Approved'}
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'rejected' ? 'bg-pink-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {isAr ? 'المرفوضة' : 'Rejected'}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all' ? 'bg-pink-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/40">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'لا توجد طلبات دفع في هذا القسم' : 'No payments found in this filter'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(payment => {
            const receiptUrl = getReceiptUrl(payment.receiptPath);
            return (
              <div
                key={payment.id}
                className="glass-card p-6 border transition-all hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left/Main Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-white font-bold text-base">
                      {isAr ? `طلب تحويل #${payment.id}` : `Payment #${payment.id}`}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      payment.provider === 'instapay'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {payment.provider === 'instapay' ? '⚡ InstaPay' : '📱 Vodafone Cash'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      payment.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : payment.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {payment.status === 'approved' ? (isAr ? 'تم الاعتماد' : 'Approved') :
                       payment.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected') : (isAr ? 'بانتظار المراجعة' : 'Pending Review')}
                    </span>
                  </div>

                  {/* Customer & Gift Meta */}
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-white/60">
                    <div>
                      <span className="text-white/40">{isAr ? 'العميل: ' : 'Customer: '}</span>
                      <span className="text-white font-medium">{payment.user?.username || 'User'}</span>
                      <span className="text-white/40"> ({payment.user?.email || `ID ${payment.userId}`})</span>
                    </div>
                    <div>
                      <span className="text-white/40">{isAr ? 'الهدية: ' : 'Gift: '}</span>
                      {payment.gift ? (
                        <a
                          href={`/gift/${payment.gift.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          {payment.gift.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-white/40">#{payment.giftId}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-white/40">{isAr ? 'المبلغ: ' : 'Amount: '}</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {payment.amount ?? 149} {payment.currency ?? 'EGP'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">{isAr ? 'رقم المعاملة (Ref): ' : 'Ref Code: '}</span>
                      <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 select-all">
                        {payment.transactionReference || (isAr ? 'غير محدد' : 'N/A')}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/30 text-[11px]">
                    {isAr ? 'تاريخ الطلب: ' : 'Submitted: '}
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* RECEIPT SECTION (The Core Requirement!) */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/10">
                  {receiptUrl ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setSelectedReceipt({ url: receiptUrl, title: `Payment #${payment.id} Receipt` })}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/20 cursor-pointer bg-black/40 flex-shrink-0"
                      >
                        <img
                          src={receiptUrl}
                          alt="Receipt Preview"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-white/80 block flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>{isAr ? 'إيصال التحويل' : 'Transfer Receipt'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt({ url: receiptUrl, title: `Payment #${payment.id} Receipt` })}
                          className="btn-romantic-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'عرض الإيصال مكبراً' : 'Inspect Receipt'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center text-white/40 text-xs">
                      <FileText className="w-5 h-5 mx-auto mb-1 opacity-40" />
                      <span>{isAr ? 'لم يرفق إيصال' : 'No receipt attached'}</span>
                    </div>
                  )}

                  {/* Actions for Pending */}
                  {payment.status === 'awaiting_review' && (
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => approve.mutate(payment.id)}
                        disabled={approve.isPending || reject.isPending}
                        className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md shadow-pink-500/20"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-300" />
                        <span>{isAr ? 'اعتماد ونشر الهدية' : t('adm_action_approve')}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isAr ? 'هل أنت متأكد من رفض هذا التحويل؟' : 'Reject this payment?')) {
                            reject.mutate(payment.id);
                          }
                        }}
                        disabled={approve.isPending || reject.isPending}
                        className="btn-secondary text-xs py-2 px-3 text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{isAr ? 'رفض' : t('adm_action_reject')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SIZE RECEIPT MODAL LIGHTBOX */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#121224] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <ImageIcon className="w-5 h-5 text-pink-400" />
                <span>{selectedReceipt.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedReceipt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح في نافذة مستقلة' : 'Open in new tab'}</span>
                </a>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 overflow-auto flex items-center justify-center max-h-[75vh] bg-black/60">
              <img
                src={selectedReceipt.url}
                alt="Receipt Full Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-white/10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 5. Settings Tab (Monetization & Gate Controls) ───────────────────────────
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
      <div>
        <h2 className="text-2xl font-bold text-white">{isAr ? 'إعدادات المنصة والدفع' : t('adm_nav_settings')}</h2>
        <p className="text-white/50 text-sm mt-1">
          {isAr ? 'التحكم في تفعيل أو تعطيل الدفع، وأسعار الهدايا، وبيانات التحويل.' : 'Manage payment gate activation, pricing, and payout accounts.'}
        </p>
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

// ── Main Admin Dashboard (Synchronized with URL params) ──────────────────────
export default function AdminDashboard() {
  const { t } = useTranslation();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const validTabs: AdminTab[] = ['stats', 'users', 'gifts', 'payments', 'settings'];
  const activeTab: AdminTab = validTabs.includes(urlTab as AdminTab) ? (urlTab as AdminTab) : 'stats';

  const setTab = (newTab: AdminTab) => {
    navigate(newTab === 'stats' ? '/admin' : `/admin/${newTab}`);
  };

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'stats', label: t('adm_nav_stats'), icon: BarChart2 },
    { id: 'users', label: t('adm_nav_users'), icon: Users },
    { id: 'gifts', label: t('adm_nav_gifts'), icon: Gift },
    { id: 'payments', label: t('adm_nav_payments'), icon: CreditCard },
    { id: 'settings', label: t('adm_nav_settings'), icon: Settings },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">{t('adm_title')}</h1>
      </div>

      {/* Top Tab Bar (synchronized with URL and sidebar) */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && <StatsTab onNavigate={setTab} />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'gifts' && <GiftsTab />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}
