import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Save, Eye, Sparkles, Image as ImageIcon, Palette, ExternalLink, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi, uploadsApi } from '../services/api';
import { THEMES, getThemeById } from '../lib/themes';
import ThemePreviewModal from '../components/themes/ThemePreviewModal';
import PhotoUploader, { type UploadedPhoto } from '../components/media/PhotoUploader';
import type { Theme } from '../types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const giftId = parseInt(id!, 10);

  const [modalTheme, setModalTheme] = useState<Theme | null>(null);

  const { data: gift, isLoading } = useQuery({
    queryKey: ['gift', giftId],
    queryFn: () => giftsApi.get(giftId).then(r => r.data.gift),
    enabled: !!giftId,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (gift) {
      reset(gift);
    }
  }, [gift, reset]);

  const selectedThemeId = watch('themeId') || gift?.themeId || 'midnight';
  const currentTheme = getThemeById(selectedThemeId);

  const saveMutation = useMutation({
    mutationFn: (data: any) => giftsApi.update(giftId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift', giftId] });
      toast.success(isAr ? 'تم حفظ التعديلات بنجاح! ✨' : 'Changes saved successfully! ✨');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Failed to save changes'));
    },
  });

  // Handle direct upload of memories in editor
  const handleDirectUpload = async (file: File) => {
    try {
      const uploadRes = await uploadsApi.upload(file);
      if (uploadRes.data?.url) {
        await giftsApi.addMemory(giftId, {
          imageUrl: uploadRes.data.url,
          title: '',
          caption: '',
          sortOrder: (gift?.memories?.length || 0),
        });
        qc.invalidateQueries({ queryKey: ['gift', giftId] });
        toast.success(isAr ? 'تمت إضافة الصورة إلى الذكريات!' : 'Photo added to memories!');
      }
    } catch (err: any) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Failed to upload photo');
      throw err;
    }
  };

  // Handle direct deletion of memories in editor
  const handleDirectDelete = async (photo: UploadedPhoto) => {
    if (!photo.id) return;
    try {
      const memId = typeof photo.id === 'string' ? parseInt(photo.id, 10) : photo.id;
      if (!isNaN(memId)) {
        await giftsApi.deleteMemory(giftId, memId);
        qc.invalidateQueries({ queryKey: ['gift', giftId] });
        toast.success(isAr ? 'تم حذف الصورة من الذكريات' : 'Photo removed from memories');
      }
    } catch (err: any) {
      toast.error(isAr ? 'فشل حذف الصورة' : 'Failed to delete photo');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!gift) return null;

  // Format memories for PhotoUploader
  const existingPhotos: UploadedPhoto[] = (gift.memories || []).map(m => ({
    id: m.id,
    imageUrl: m.imageUrl,
    title: m.title || '',
    caption: m.caption || '',
    memoryDate: m.memoryDate,
  }));

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💝</span>
              <h1 className="text-2xl font-bold text-white">{gift.title}</h1>
            </div>
            <p className="text-white/40 text-sm mt-1">
              {isAr ? 'القالب الحالي:' : 'Current Theme:'}{' '}
              <span className="font-semibold" style={{ color: currentTheme.primaryColor }}>
                {isAr ? currentTheme.nameAr : currentTheme.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`/gift/${gift.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 text-sm"
            >
              <ExternalLink className="w-4 h-4 text-pink-400" />
              <span>{isAr ? 'عرض الموقع المباشر' : 'View Live Gift'}</span>
            </a>

            <button
              type="button"
              onClick={handleSubmit((data) => saveMutation.mutate(data))}
              disabled={saveMutation.isPending}
              className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saveMutation.isPending ? t('wiz_saving') : t('save')}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-8">
          {/* Section 1: Theme Selection & Preview */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isAr ? 'قالب ومظهر الهدية' : 'Theme & Appearance'}
                  </h2>
                  <p className="text-white/40 text-xs">
                    {isAr
                      ? 'يمكنك تغيير القالب في أي وقت ومعاينته قبل الحفظ'
                      : 'You can change themes anytime and preview before saving'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalTheme(currentTheme)}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-pink-400" />
                <span>{isAr ? 'معاينة القالب الحالي' : 'Preview Current'}</span>
              </button>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map(theme => (
                <div
                  key={theme.id}
                  onClick={() => setValue('themeId', theme.id, { shouldDirty: true })}
                  className={`group cursor-pointer glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02] relative ${
                    selectedThemeId === theme.id ? 'border-pink-500 ring-2 ring-pink-500/50' : 'hover:border-white/30'
                  }`}
                >
                  <div className={`h-20 ${theme.previewGradient} flex items-center justify-center relative`}>
                    <Heart className="w-5 h-5 text-white/40 fill-white/30" />
                    {selectedThemeId === theme.id && (
                      <div className="absolute w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center top-2 end-2 shadow">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTheme(theme);
                      }}
                      className="absolute bottom-1.5 inset-x-2 py-0.5 px-2 rounded-md bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-all opacity-90 group-hover:opacity-100"
                    >
                      <Eye className="w-3 h-3 text-pink-400" />
                      <span>{isAr ? 'معاينة' : 'Preview'}</span>
                    </button>
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-white text-xs font-semibold">{isAr ? theme.nameAr : theme.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Photo Gallery & Memories (Where to upload photos!) */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isAr ? 'معرض الصور والذكريات' : 'Photo Gallery & Memories'}
                </h2>
                <p className="text-white/40 text-xs">
                  {isAr
                    ? 'ارفع صوركما معاً مباشرة وسيتم حفظها وعرضها في موقع الهدية'
                    : 'Upload photos of your special moments to be displayed in your gift website'}
                </p>
              </div>
            </div>

            <PhotoUploader
              photos={existingPhotos}
              onChange={() => {}}
              onDirectUpload={handleDirectUpload}
              onDirectDelete={handleDirectDelete}
            />
          </div>

          {/* Section 3: Basic Info */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{isAr ? 'البيانات الأساسية' : 'Basic Information'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{isAr ? 'عنوان الهدية' : 'Gift Title'}</label>
                <input {...register('title')} className="input-field" />
              </div>
              <div>
                <label className="label-text">{t('wiz_sender')}</label>
                <input {...register('senderName')} className="input-field" />
              </div>
              <div>
                <label className="label-text">{t('wiz_recipient')}</label>
                <input {...register('recipientName')} className="input-field" />
              </div>
              <div>
                <label className="label-text">{isAr ? 'تاريخ الذكرى السنوية' : 'Anniversary Date'}</label>
                <input {...register('anniversaryDate')} type="date" className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-text">{t('wiz_welcome_msg')}</label>
              <textarea {...register('welcomeMessage')} className="input-field min-h-24 resize-none" />
            </div>
          </div>

          {/* Section 4: Music */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎵 {isAr ? 'الموسيقى والخلفية الصوتية' : 'Background Music'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{t('wiz_music_url')}</label>
                <input {...register('musicUrl')} className="input-field" placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="label-text">{t('wiz_music_title')}</label>
                <input {...register('musicTitle')} className="input-field" placeholder="Our Special Song" />
              </div>
            </div>
          </div>

          {/* Section 5: Love Letter */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>💌 {isAr ? 'رسالة الحب' : 'Love Letter'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">{isAr ? 'عنوان الرسالة' : 'Letter Title'}</label>
                <input {...register('letterTitle')} className="input-field" />
              </div>
              <div>
                <label className="label-text">{isAr ? 'التوقيع' : 'Signature'}</label>
                <input {...register('letterSignature')} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-text">{isAr ? 'نص رسالة الحب' : 'Letter Content'}</label>
              <textarea {...register('letterContent')} className="input-field min-h-36 resize-none" />
            </div>
          </div>

          {/* Section 6: Surprise & Publication */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎁 {isAr ? 'المفاجأة والنشر' : 'Surprise & Publishing'}</span>
            </h2>
            <div>
              <label className="label-text">{isAr ? 'عنوان المفاجأة' : 'Surprise Title'}</label>
              <input {...register('surpriseTitle')} className="input-field" />
            </div>
            <div>
              <label className="label-text">{isAr ? 'رسالة المفاجأة' : 'Surprise Message'}</label>
              <textarea {...register('surpriseMessage')} className="input-field min-h-24 resize-none" />
            </div>
            <div>
              <label className="label-text">{isAr ? 'حالة النشر' : 'Publication Status'}</label>
              <select {...register('status')} className="input-field">
                <option value="draft">{isAr ? 'مسودة خاصة (غير منشورة)' : 'Private Draft'}</option>
                <option value="published">{isAr ? 'منشور للعامة (رابط مباشر)' : 'Published (Public link)'}</option>
              </select>
            </div>
          </div>

          {/* Bottom Save Button */}
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base font-semibold shadow-xl shadow-pink-500/20"
          >
            <Save className="w-5 h-5" />
            <span>{saveMutation.isPending ? t('wiz_saving') : (isAr ? 'حفظ كافة التعديلات' : 'Save All Changes')}</span>
          </button>
        </form>

        {/* Theme Interactive Preview Modal */}
        <ThemePreviewModal
          theme={modalTheme}
          isOpen={!!modalTheme}
          onClose={() => setModalTheme(null)}
          onSelect={(themeId) => setValue('themeId', themeId, { shouldDirty: true })}
          isSelected={selectedThemeId === modalTheme?.id}
        />
      </div>
    </div>
  );
}
