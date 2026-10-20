import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { CreditCard, Smartphone, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi, paymentsApi } from '../services/api';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const giftId = parseInt(id!, 10);

  const [provider, setProvider] = useState<'instapay' | 'vodafone_cash'>('instapay');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: gift } = useQuery({
    queryKey: ['gift', giftId],
    queryFn: () => giftsApi.get(giftId).then(r => r.data.gift),
    enabled: !!giftId,
  });

  const { data: paySettings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: () => paymentsApi.getSettings().then(r => r.data.settings),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<{ transactionReference: string }>();

  const submitPayment = useMutation({
    mutationFn: ({ transactionReference }: { transactionReference: string }) =>
      paymentsApi.submit({ giftId, provider, transactionReference, receipt: receipt ?? undefined }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Payment submitted for review!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('error_generic')),
  });

  const isAr = t('dir') === 'rtl';

  if (!paySettings) return null;

  // Free mode
  if (!paySettings.paymentsEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {isAr ? 'المنصة مجانية بالكامل!' : t('pay_free_mode_notice')}
          </h1>
          <p className="text-white/50 mb-6">
            {isAr ? 'الدفع غير مطلوب حالياً. هديتك مفعلة ومتاحة مجاناً بدون أي رسوم!' : 'Publishing is currently free. Your gift is ready!'}
          </p>
          <button onClick={() => navigate(gift?.slug ? `/gift/${gift.slug}` : '/dashboard')} className="btn-primary">
            {isAr ? 'عرض هديتك الآن ←' : 'View Your Gift →'}
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">
            {isAr ? 'تم إرسال بيانات التحويل بنجاح!' : 'Payment Submitted!'}
          </h1>
          <p className="text-white/50 mb-6">
            {isAr
              ? 'تم استلام بيانات التحويل، وسيقوم فريق العمل بمراجعتها وتفعيل هديتك في أسرع وقت.'
              : 'We received your transfer details. Once verified (usually within a few hours), your gift will go live automatically.'}
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">{t('pay_checkout_title')}</h1>
          <p className="text-white/50 mt-2">
            {t('pay_amount_due')} <span className="text-pink-400 font-bold text-xl">{paySettings.price} {paySettings.currency}</span>
          </p>
        </div>

        {/* Provider selector */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Select Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {paySettings.instapay.enabled && (
              <button
                onClick={() => setProvider('instapay')}
                className={`p-4 rounded-xl border text-center transition-all ${
                  provider === 'instapay'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{t('pay_method_instapay')}</p>
              </button>
            )}
            {paySettings.vodafoneCash.enabled && (
              <button
                onClick={() => setProvider('vodafone_cash')}
                className={`p-4 rounded-xl border text-center transition-all ${
                  provider === 'vodafone_cash'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{t('pay_method_vodafone')}</p>
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-card p-6 mb-6">
          {provider === 'instapay' && paySettings.instapay.enabled ? (
            <>
              <h3 className="text-white font-semibold mb-2">InstaPay Instructions</h3>
              <div className="glass-card-pink p-4 mb-3">
                <p className="text-pink-300 font-mono text-lg text-center">{paySettings.instapay.address}</p>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{paySettings.instapay.instructions}</p>
            </>
          ) : (
            <>
              <h3 className="text-white font-semibold mb-2">Vodafone Cash Instructions</h3>
              <div className="glass-card-pink p-4 mb-3">
                <p className="text-pink-300 font-mono text-lg text-center">{paySettings.vodafoneCash.number}</p>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{paySettings.vodafoneCash.instructions}</p>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((d) => submitPayment.mutate(d))} className="glass-card p-6 space-y-5">
          <div>
            <label className="label-text">{t('pay_ref_label')}</label>
            <input {...register('transactionReference', { required: 'Transaction reference is required' })} className="input-field" placeholder="Transaction reference number" />
            {errors.transactionReference && <p className="text-red-400 text-xs mt-1">{errors.transactionReference.message}</p>}
          </div>
          <div>
            <label className="label-text">{t('pay_receipt_label')}</label>
            <label className="flex items-center gap-3 p-4 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500/40 transition-colors">
              <Upload className="w-5 h-5 text-white/30" />
              <span className="text-white/40 text-sm">{receipt ? receipt.name : 'Click to upload receipt screenshot'}</span>
              <input type="file" accept="image/*,.pdf" className="sr-only" onChange={e => setReceipt(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <button type="submit" disabled={submitPayment.isPending} className="btn-primary w-full py-4">
            {submitPayment.isPending ? 'Submitting...' : t('pay_btn_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
