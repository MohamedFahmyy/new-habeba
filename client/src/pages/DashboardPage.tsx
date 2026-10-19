import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit3, Eye, Copy, Trash2, CreditCard, BarChart2, Heart, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Gift } from '../types';
import { getThemeById } from '../lib/themes';

function GiftStatusBadge({ gift }: { gift: Gift }) {
  const { t } = useTranslation();
  if (gift.paymentStatus === 'paid') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
      {t('dash_payment_paid')}
    </span>
  );
  if (gift.paymentStatus === 'pending') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
      {t('dash_payment_pending')}
    </span>
  );
  if (gift.status === 'published') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs">
      {t('dash_status_published')}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs">
      {t('dash_status_draft')}
    </span>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => giftsApi.list().then(r => r.data.gifts),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => giftsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gifts'] }); toast.success('Gift deleted'); },
    onError: () => toast.error(t('error_generic')),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => giftsApi.duplicate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gifts'] }); toast.success('Gift duplicated!'); },
    onError: () => toast.error(t('error_generic')),
  });

  const gifts = data ?? [];
  const totalPublished = gifts.filter(g => g.status === 'published').length;
  const totalDrafts = gifts.filter(g => g.status === 'draft').length;
  const totalViews = gifts.reduce((s, g) => s + g.viewsCount, 0);

  const copyLink = (gift: Gift) => {
    const url = `${window.location.origin}/gift/${gift.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success(t('dash_copy_success')));
  };

  const handleDelete = (gift: Gift) => {
    if (window.confirm(t('dash_confirm_delete'))) {
      deleteMutation.mutate(gift.id);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="page-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {t('dash_welcome', { name: user?.username ?? '' })}
          </h1>
          <p className="text-white/50 mt-2">{t('dash_subtitle')}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: t('dash_stat_total'), value: gifts.length, icon: Heart, color: 'text-pink-400' },
            { label: t('dash_stat_published'), value: totalPublished, icon: ExternalLink, color: 'text-green-400' },
            { label: t('dash_stat_drafts'), value: totalDrafts, icon: Edit3, color: 'text-yellow-400' },
            { label: t('dash_stat_views'), value: totalViews, icon: BarChart2, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <div className="text-3xl font-bold text-white">{value}</div>
              <div className="text-white/40 text-sm">{label}</div>
            </div>
          ))}
        </div>

        {/* Create button */}
        <div className="flex justify-end mb-6">
          <Link to="/wizard" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('dash_btn_create')}
          </Link>
        </div>

        {/* Gifts grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-40 bg-white/5 rounded-xl mb-4" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card p-12 text-center">
            <p className="text-red-400">{t('error_generic')}</p>
          </div>
        ) : gifts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
            <div className="text-6xl mb-6 animate-float">💝</div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('dash_no_gifts_title')}</h2>
            <p className="text-white/50 mb-8">{t('dash_no_gifts_desc')}</p>
            <Link to="/wizard" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> {t('dash_btn_create')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift, i) => {
              const theme = getThemeById(gift.themeId);
              return (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden group hover:border-pink-500/20 transition-all"
                >
                  {/* Theme preview */}
                  <div className={`h-36 ${theme.previewGradient} relative flex items-center justify-center`}>
                    <Heart className="w-10 h-10 text-white/30 fill-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 start-3">
                      <GiftStatusBadge gift={gift} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-lg mb-1 truncate">{gift.title}</h3>
                    <p className="text-white/40 text-sm mb-1">{gift.senderName} → {gift.recipientName}</p>
                    <p className="text-white/30 text-xs mb-4">{gift.viewsCount} views</p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/editor/${gift.id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> {t('dash_action_edit')}
                      </Link>
                      <Link to={`/gift/${gift.slug}`} target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {t('dash_action_preview')}
                      </Link>
                      <button onClick={() => copyLink(gift)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> {t('dash_action_copy')}
                      </button>
                      <button onClick={() => duplicateMutation.mutate(gift.id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> {t('dash_action_duplicate')}
                      </button>
                      {gift.paymentStatus === 'free' && (
                        <Link to={`/checkout/${gift.id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-yellow-400 border-yellow-500/20">
                          <CreditCard className="w-3 h-3" /> {t('dash_action_checkout')}
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(gift)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-red-400 border-red-500/20 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" /> {t('dash_action_delete')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
