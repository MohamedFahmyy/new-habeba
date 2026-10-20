import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight, ChevronLeft, Check, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi } from '../../services/api';
import { THEMES, getThemeById } from '../../lib/themes';
import ThemePreviewModal from '../../components/themes/ThemePreviewModal';
import PhotoUploader, { type UploadedPhoto } from '../../components/media/PhotoUploader';
import type { WizardFormData, Theme } from '../../types';

// ── Step schemas ─────────────────────────────────────────────────────────────
const step1Schema = z.object({
  senderName: z.string().min(1, 'Required'),
  recipientName: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  welcomeMessage: z.string().optional().default(''),
});

const fullSchema = z.object({
  senderName: z.string().min(1),
  recipientName: z.string().min(1),
  title: z.string().min(1),
  welcomeMessage: z.string().optional().default(''),
  themeId: z.string().default('midnight'),
  galleryStyle: z.enum(['masonry', 'polaroid', 'grid']).default('masonry'),
  musicUrl: z.string().optional().default(''),
  musicTitle: z.string().optional().default(''),
  letterTitle: z.string().optional().default(''),
  letterContent: z.string().optional().default(''),
  letterSignature: z.string().optional().default(''),
  surpriseTitle: z.string().optional().default(''),
  surpriseMessage: z.string().optional().default(''),
  anniversaryDate: z.string().optional().default(''),
  slug: z.string().optional().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  showTimeline: z.boolean().default(true),
  showGallery: z.boolean().default(true),
  showLetter: z.boolean().default(true),
  showCounters: z.boolean().default(true),
  showSurprise: z.boolean().default(true),
});

const STEPS = [
  'wiz_step1', 'wiz_step2', 'wiz_step3', 'wiz_step4', 'wiz_step5', 'wiz_step6',
];

// ── Steps ─────────────────────────────────────────────────────────────────────
function Step1({ register, errors }: any) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">{t('wiz_step1')}</h2>
      {[
        { key: 'senderName', label: t('wiz_sender'), placeholder: 'Your name' },
        { key: 'recipientName', label: t('wiz_recipient'), placeholder: "Partner's name" },
        { key: 'title', label: t('wiz_site_title'), placeholder: 'Our Love Story' },
        { key: 'welcomeMessage', label: t('wiz_welcome_msg'), placeholder: 'A warm welcome message...', textarea: true },
      ].map(({ key, label, placeholder, textarea }) => (
        <div key={key}>
          <label className="label-text">{label}</label>
          {textarea ? (
            <textarea {...register(key)} className="input-field min-h-24 resize-none" placeholder={placeholder} />
          ) : (
            <input {...register(key)} className="input-field" placeholder={placeholder} />
          )}
          {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]?.message}</p>}
        </div>
      ))}
    </div>
  );
}

function Step2({ watch, setValue }: any) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const selectedTheme = watch('themeId');
  const [modalTheme, setModalTheme] = useState<Theme | null>(null);

  const currentTheme = getThemeById(selectedTheme);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('wiz_step2')}</h2>
          <p className="text-white/40 text-xs mt-1">
            {isAr
              ? 'اختر الطابع الجمالي لموقعك، واضغط زر المعاينة لمشاهدة تفاصيل القالب'
              : 'Choose the visual style for your gift, and click preview to see full details'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {THEMES.map(theme => (
          <div
            key={theme.id}
            onClick={() => setValue('themeId', theme.id)}
            className={`group cursor-pointer glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02] relative ${
              selectedTheme === theme.id ? 'border-pink-500 ring-2 ring-pink-500/50' : 'hover:border-white/30'
            }`}
          >
            {/* Visual Header */}
            <div className={`h-24 ${theme.previewGradient} flex items-center justify-center relative`}>
              <Heart className="w-6 h-6 text-white/40 fill-white/30 group-hover:scale-110 transition-transform" />

              {/* Selection Checkmark */}
              {selectedTheme === theme.id && (
                <div className="absolute w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center top-2 end-2 shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Preview Button on Hover / Touch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalTheme(theme);
                }}
                className="absolute bottom-2 inset-x-2 py-1 px-2 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all opacity-90 group-hover:opacity-100 hover:text-pink-300"
                title={isAr ? 'معاينة القالب' : 'Preview Theme'}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة القالب' : 'Preview'}</span>
              </button>
            </div>

            {/* Info */}
            <div className="p-2.5 text-center">
              <p className="text-white text-xs font-semibold">{isAr ? theme.nameAr : theme.name}</p>
              <p className="text-white/40 text-[10px] line-clamp-1 mt-0.5">
                {isAr ? theme.descriptionAr : theme.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Theme Highlight Banner */}
      {currentTheme && (
        <div className="p-4 rounded-2xl glass-card flex items-center justify-between gap-4 border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})` }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold flex items-center gap-2">
                <span>{isAr ? currentTheme.nameAr : currentTheme.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  {isAr ? 'القالب المختار' : 'Selected'}
                </span>
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {isAr ? currentTheme.descriptionAr : currentTheme.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalTheme(currentTheme)}
            className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 shrink-0 hover:border-pink-500/50"
          >
            <Eye className="w-4 h-4 text-pink-400" />
            <span>{isAr ? 'معاينة حية كاملة' : 'Full Live Preview'}</span>
          </button>
        </div>
      )}

      {/* Theme Interactive Preview Modal */}
      <ThemePreviewModal
        theme={modalTheme}
        isOpen={!!modalTheme}
        onClose={() => setModalTheme(null)}
        onSelect={(themeId) => setValue('themeId', themeId)}
        isSelected={selectedTheme === modalTheme?.id}
      />
    </div>
  );
}

function Step3({ register }: any) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">{t('wiz_step3')}</h2>
      <div>
        <label className="label-text">{t('wiz_music_url')}</label>
        <input {...register('musicUrl')} className="input-field" placeholder="https://www.youtube.com/watch?v=..." />
        <p className="text-white/30 text-xs mt-1">Paste a YouTube URL for background music</p>
      </div>
      <div>
        <label className="label-text">{t('wiz_music_title')}</label>
        <input {...register('musicTitle')} className="input-field" placeholder="Our Favorite Song" />
      </div>
    </div>
  );
}

function Step4({ photos, setPhotos }: { photos: UploadedPhoto[]; setPhotos: (p: UploadedPhoto[]) => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('wiz_step4')}</h2>
        <p className="text-white/50 text-sm mt-1">
          {isAr
            ? 'ارفع صور ذكرياتكما معاً وأضف تعليقات عليها لتظهر في معرض صور رومانسي ساحر.'
            : 'Upload photos of your special moments together with titles and captions for a romantic gallery.'}
        </p>
      </div>

      <PhotoUploader photos={photos} onChange={setPhotos} />
    </div>
  );
}

function Step5({ register }: any) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white mb-6">{t('wiz_step5')}</h2>
      {[
        { key: 'letterTitle', label: 'Letter Title', placeholder: 'A Letter To My Love' },
        { key: 'letterSignature', label: 'Signature', placeholder: 'Forever Yours, ...' },
        { key: 'surpriseTitle', label: 'Surprise / Promise Title', placeholder: 'Forever Starts With You ❤️' },
        { key: 'anniversaryDate', label: 'Anniversary Date', placeholder: '2024-02-14', type: 'date' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="label-text">{label}</label>
          <input {...register(key)} type={type ?? 'text'} className="input-field" placeholder={placeholder} />
        </div>
      ))}
      <div>
        <label className="label-text">Love Letter</label>
        <textarea {...register('letterContent')} className="input-field min-h-40 resize-none" placeholder="Write your love letter here..." />
      </div>
      <div>
        <label className="label-text">Surprise Message</label>
        <textarea {...register('surpriseMessage')} className="input-field min-h-24 resize-none" placeholder="Your final promise / surprise message..." />
      </div>
    </div>
  );
}

function Step6({ watch, setValue, photosCount }: any) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const values = watch();
  const currentTheme = getThemeById(values.themeId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t('wiz_step6')}</h2>
      {/* Summary */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{isAr ? 'ملخص الهدية' : 'Gift Summary'}</span>
        </h3>
        {[
          [isAr ? 'العنوان' : 'Title', values.title || '—'],
          [isAr ? 'المرسل' : 'From', values.senderName || '—'],
          [isAr ? 'المستلم' : 'To', values.recipientName || '—'],
          [isAr ? 'القالب المختار' : 'Theme', isAr ? currentTheme.nameAr : currentTheme.name],
          [isAr ? 'الصور المرفوعة' : 'Photos', `${photosCount} ${isAr ? 'صورة' : 'photos'}`],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
            <span className="text-white/40">{label}</span>
            <span className="text-white font-medium">{val}</span>
          </div>
        ))}
      </div>
      {/* Publish mode */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">{isAr ? 'إعداد النشر' : 'Publish Setting'}</h3>
        <div className="flex gap-3">
          {['draft', 'published'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setValue('status', s)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                values.status === s
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                  : 'border-white/10 text-white/50 hover:border-white/30'
              }`}
            >
              {s === 'draft' ? t('wiz_btn_save_draft') : t('wiz_btn_publish')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────────
export default function WizardPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const themeParam = searchParams.get('theme');
  const initialTheme = themeParam && THEMES.some(t => t.id === themeParam) ? themeParam : 'midnight';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const methods = useForm<WizardFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      themeId: initialTheme, galleryStyle: 'masonry', status: 'draft',
      showTimeline: true, showGallery: true, showLetter: true, showCounters: true, showSurprise: true,
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = methods;

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
    return match?.[1] ?? '';
  };

  const onSubmit = async (data: WizardFormData) => {
    setSaving(true);
    try {
      const musicVideoId = data.musicUrl ? extractYouTubeId(data.musicUrl) : '';
      const res = await giftsApi.create({ ...data, musicVideoId });
      const createdGift = res.data.gift;

      // Automatically attach all uploaded photos as memories
      if (photos.length > 0 && createdGift?.id) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          try {
            await giftsApi.addMemory(createdGift.id, {
              imageUrl: photo.imageUrl,
              title: photo.title || undefined,
              caption: photo.caption || undefined,
              sortOrder: i,
            });
          } catch (memErr) {
            console.error('Failed to attach memory:', memErr);
          }
        }
      }

      if (createdGift?.paymentStatus === 'unpaid') {
        toast.success(isAr ? 'تم حفظ الهدية! يرجى إتمام التفعيل لنشرها 💳' : 'Gift saved! Please complete activation to publish 💳');
        navigate(`/checkout/${createdGift.id}`);
      } else if (data.status === 'published') {
        toast.success(isAr ? 'تم نشر الهدية بنجاح! 🎉' : 'Gift published! 🎉');
        navigate(`/gift/${createdGift.slug}`);
      } else {
        toast.success(isAr ? 'تم حفظ المسودة!' : 'Draft saved!');
        navigate(`/editor/${createdGift.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('error_generic'));
    } finally {
      setSaving(false);
    }
  };

  const stepComponents = [
    <Step1 register={register} errors={errors} />,
    <Step2 watch={watch} setValue={setValue} />,
    <Step3 register={register} />,
    <Step4 photos={photos} setPhotos={setPhotos} />,
    <Step5 register={register} />,
    <Step6 watch={watch} setValue={setValue} photosCount={photos.length} />,
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3 animate-heartbeat">💝</div>
          <h1 className="text-3xl font-bold text-white">{t('wiz_title')}</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-10 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-pink-500 text-white' :
                i === step ? 'bg-pink-500/20 border-2 border-pink-500 text-pink-400' :
                'bg-white/5 text-white/30 border border-white/10'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 transition-all ${i < step ? 'bg-pink-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <FormProvider {...methods}>
          <div className="glass-card p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {stepComponents[step]}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> {t('wiz_btn_prev')}
              </button>

              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-2">
                  {t('wiz_btn_next')} <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('wiz_saving')}</>
                  ) : (
                    <><Heart className="w-4 h-4 fill-white" /> {t('wiz_btn_publish')}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
