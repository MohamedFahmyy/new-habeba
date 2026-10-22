import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Save, Eye, Sparkles, Image as ImageIcon, Palette, ExternalLink, Heart, Plus, Trash2, Infinity as InfinityIcon, Video, Camera, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi, uploadsApi } from '../services/api';
import { THEMES, getThemeById } from '../lib/themes';
import ThemePreviewModal from '../components/themes/ThemePreviewModal';
import PhotoUploader, { type UploadedPhoto } from '../components/media/PhotoUploader';
import { extractYouTubeId } from '../lib/youtube';
import type { Theme } from '../types';

interface EditableCounter {
  id?: number;
  label: string;
  targetValue: number;
  icon: string;
  sortOrder: number;
}

const DEFAULT_COUNTERS: EditableCounter[] = [
  { label: 'MEMORIES', targetValue: 1000, icon: 'infinity', sortOrder: 0 },
  { label: 'VIDEOS', targetValue: 50, icon: 'video', sortOrder: 1 },
  { label: 'PHOTOS', targetValue: 150, icon: 'camera', sortOrder: 2 },
  { label: 'DAYS TOGETHER', targetValue: 70, icon: 'heart', sortOrder: 3 },
];

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const giftId = parseInt(id!, 10);

  const [modalTheme, setModalTheme] = useState<Theme | null>(null);
  const [counters, setCounters] = useState<EditableCounter[]>(DEFAULT_COUNTERS);

  const { data: gift, isLoading } = useQuery({
    queryKey: ['gift', giftId],
    queryFn: () => giftsApi.get(giftId).then(r => r.data.gift),
    enabled: !!giftId,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (gift) {
      reset(gift);
      if (gift.counters && gift.counters.length > 0) {
        setCounters(
          [...gift.counters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        );
      } else {
        setCounters(DEFAULT_COUNTERS);
      }
    }
  }, [gift, reset]);

  const selectedThemeId = watch('themeId') || gift?.themeId || 'midnight';
  const currentTheme = getThemeById(selectedThemeId);

  const handleCounterChange = (index: number, field: keyof EditableCounter, value: any) => {
    setCounters(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCounter = () => {
    setCounters(prev => [
      ...prev,
      {
        label: isAr ? 'أيام سعيدة' : 'HAPPY DAYS',
        targetValue: 100,
        icon: 'star',
        sortOrder: prev.length,
      },
    ]);
  };

  const handleRemoveCounter = (index: number) => {
    if (counters.length <= 1) {
      toast.error(isAr ? 'يجب الإبقاء على بطاقة رقم واحدة على الأقل' : 'Keep at least one counter card');
      return;
    }
    setCounters(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetCounters = () => {
    setCounters(DEFAULT_COUNTERS);
    toast.success(isAr ? 'تم استعادة الأرقام الافتراضية' : 'Reset to default numbers');
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const musicVideoId = data.musicUrl ? extractYouTubeId(data.musicUrl) : (data.musicVideoId || '');
      return giftsApi.update(giftId, {
        ...data,
        musicVideoId,
        counters: counters.map((c, index) => ({
          ...c,
          sortOrder: index,
          targetValue: Number(c.targetValue) || 0,
        })),
      });
    },
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
        const memRes = await giftsApi.addMemory(giftId, {
          imageUrl: uploadRes.data.url,
          title: '',
          caption: '',
          sortOrder: (gift?.memories?.length || 0),
        });
        qc.invalidateQueries({ queryKey: ['gift', giftId] });
        toast.success(isAr ? 'تمت إضافة الصورة إلى الذكريات!' : 'Photo added to memories!');
        return {
          id: memRes.data?.memory?.id,
          imageUrl: uploadRes.data.url,
          title: '',
          caption: '',
        };
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

  // Handle direct title/caption update of memories in editor
  const handleDirectUpdate = async (photo: UploadedPhoto, field: 'title' | 'caption', value: string) => {
    if (!photo.id) return;
    try {
      const memId = typeof photo.id === 'string' ? parseInt(photo.id, 10) : photo.id;
      if (!isNaN(memId)) {
        await giftsApi.updateMemory(giftId, memId, { [field]: value });
      }
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const renderCounterIcon = (icon: string) => {
    switch (icon) {
      case 'infinity':
        return <InfinityIcon className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'camera':
        return <Camera className="w-5 h-5 text-pink-400" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'star':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'smile':
        return <span className="text-lg">😊</span>;
      case 'message':
        return <span className="text-lg">💌</span>;
      default:
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
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
              onDirectUpdate={handleDirectUpdate}
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

          {/* Section 6: Our Numbers (Counters) */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔢 {isAr ? 'أرقامنا المميزة (Our Numbers)' : 'Our Numbers (Milestones)'}</span>
                </h2>
                <p className="text-white/50 text-xs sm:text-sm">
                  {isAr
                    ? 'خصص الأرقام والرموز التي تظهر في قسم أرقامنا (مثل الذكريات، الصور، الأيام معاً، الفيديوهات)'
                    : 'Customize milestone numbers, icons, and labels displayed in the Our Numbers section'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-pink-500/30 transition-colors">
                  <input
                    type="checkbox"
                    {...register('showCounters')}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 bg-white/10 border-white/20"
                  />
                  <span className="text-xs sm:text-sm font-medium text-white/90">
                    {isAr ? 'إظهار هذا القسم' : 'Show Section'}
                  </span>
                </label>
              </div>
            </div>

            {/* Counters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {counters.map((c, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 hover:border-pink-500/40 rounded-2xl p-4 space-y-3 relative transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white/10 flex items-center justify-center">
                        {renderCounterIcon(c.icon)}
                      </div>
                      <span className="text-xs font-bold text-white/60">#{index + 1}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCounter(index)}
                      className="text-white/30 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                      title={isAr ? 'حذف هذا الرقم' : 'Delete counter'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-white/50 block mb-1">
                        {isAr ? 'الرمز / الأيقونة' : 'Icon'}
                      </label>
                      <select
                        value={c.icon}
                        onChange={(e) => handleCounterChange(index, 'icon', e.target.value)}
                        className="input-field py-1.5 px-2.5 text-xs bg-slate-900/90 text-white"
                      >
                        <option value="infinity">∞ {isAr ? 'المالانهاية (Memories)' : 'Infinity (Memories)'}</option>
                        <option value="video">📹 {isAr ? 'فيديو (Videos)' : 'Video (Videos)'}</option>
                        <option value="camera">📷 {isAr ? 'كاميرا (Photos)' : 'Camera (Photos)'}</option>
                        <option value="heart">❤️ {isAr ? 'قلب (Days Together)' : 'Heart (Days Together)'}</option>
                        <option value="star">✨ {isAr ? 'نجوم وتألق (Moments)' : 'Stars / Sparkles'}</option>
                        <option value="smile">😊 {isAr ? 'ابتسامات (Smiles)' : 'Smile (Smiles)'}</option>
                        <option value="message">💌 {isAr ? 'رسائل حب (Love Notes)' : 'Letter / Notes'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-white/50 block mb-1">
                        {isAr ? 'الرقم المستهدف' : 'Target Number'}
                      </label>
                      <input
                        type="number"
                        value={c.targetValue}
                        onChange={(e) => handleCounterChange(index, 'targetValue', parseInt(e.target.value, 10) || 0)}
                        className="input-field py-1.5 px-2.5 text-base font-bold text-center"
                        placeholder="1000"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-white/50 block mb-1">
                        {isAr ? 'النص / التسمية' : 'Label'}
                      </label>
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) => handleCounterChange(index, 'label', e.target.value)}
                        className="input-field py-1.5 px-2.5 text-xs font-semibold text-center uppercase tracking-wider"
                        placeholder="MEMORIES"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddCounter}
                className="btn-secondary flex items-center gap-2 py-2 px-4 text-xs font-semibold"
              >
                <Plus className="w-4 h-4 text-pink-400" />
                <span>{isAr ? 'إضافة بطاقة رقم جديدة' : 'Add New Counter Card'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCounters}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors py-1 px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'استعادة الأرقام الافتراضية' : 'Reset to Default Numbers'}</span>
              </button>
            </div>
          </div>

          {/* Section 7: Surprise & Publication */}
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
