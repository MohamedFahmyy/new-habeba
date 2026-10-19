import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi } from '../services/api';
import { getThemeById } from '../lib/themes';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const giftId = parseInt(id!, 10);

  const { data: gift, isLoading } = useQuery({
    queryKey: ['gift', giftId],
    queryFn: () => giftsApi.get(giftId).then(r => r.data.gift),
    enabled: !!giftId,
  });

  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (gift) reset(gift); }, [gift, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => giftsApi.update(giftId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift', giftId] });
      toast.success(t('wiz_saved'));
    },
    onError: () => toast.error(t('error_generic')),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
    </div>
  );

  if (!gift) return null;
  const theme = getThemeById(gift.themeId);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('ed_save_changes')} — {gift.title}</h1>
            <p className="text-white/40 text-sm mt-1">Theme: <span style={{ color: theme.primaryColor }}>{theme.name}</span></p>
          </div>
          <div className="flex gap-2">
            <a href={`/gift/${gift.slug}`} target="_blank" className="btn-secondary flex items-center gap-2">
              <Eye className="w-4 h-4" /> {t('ed_desktop')}
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold">Basic Information</h2>
            {[
              { key: 'title', label: 'Title' },
              { key: 'senderName', label: t('wiz_sender') },
              { key: 'recipientName', label: t('wiz_recipient') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <input {...register(key)} className="input-field" />
              </div>
            ))}
            <div>
              <label className="label-text">{t('wiz_welcome_msg')}</label>
              <textarea {...register('welcomeMessage')} className="input-field min-h-24 resize-none" />
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold">Music</h2>
            {[
              { key: 'musicUrl', label: t('wiz_music_url') },
              { key: 'musicTitle', label: t('wiz_music_title') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <input {...register(key)} className="input-field" />
              </div>
            ))}
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold">Love Letter</h2>
            {[
              { key: 'letterTitle', label: 'Letter Title' },
              { key: 'letterSignature', label: 'Signature' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <input {...register(key)} className="input-field" />
              </div>
            ))}
            <div>
              <label className="label-text">Letter Content</label>
              <textarea {...register('letterContent')} className="input-field min-h-40 resize-none" />
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-white font-semibold">Surprise & Publication</h2>
            {[
              { key: 'surpriseTitle', label: 'Surprise Title' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <input {...register(key)} className="input-field" />
              </div>
            ))}
            <div>
              <label className="label-text">Surprise Message</label>
              <textarea {...register('surpriseMessage')} className="input-field min-h-24 resize-none" />
            </div>
            <div>
              <label className="label-text">Status</label>
              <select {...register('status')} className="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? t('wiz_saving') : t('ed_save_changes')}
          </button>
        </form>
      </div>
    </div>
  );
}
