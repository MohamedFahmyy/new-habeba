import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  username: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(v => v, 'You must accept the terms'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      login(res.data.user);
      toast.success('Account created! Welcome to Habeba ❤️');
      navigate('/wizard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('error_generic');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('auth_register_title')}</h1>
            <p className="text-white/50 mt-2 text-sm">{t('auth_register_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label-text">{t('auth_full_name')}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input {...register('username')} type="text" className="input-field ps-10" placeholder="Your name" autoComplete="name" />
              </div>
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label-text">{t('auth_email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input {...register('email')} type="email" className="input-field ps-10" placeholder="you@example.com" autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label-text">{t('auth_password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field ps-10 pe-10"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label-text">{t('auth_confirm_password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input {...register('confirmPassword')} type="password" className="input-field ps-10" placeholder="Repeat password" autoComplete="new-password" />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input {...register('agreeTerms')} type="checkbox" id="terms" className="mt-1 w-4 h-4 accent-pink-500" />
              <label htmlFor="terms" className="text-sm text-white/60 cursor-pointer">
                {t('auth_agree_terms')}
              </label>
            </div>
            {errors.agreeTerms && <p className="text-red-400 text-xs -mt-3">{errors.agreeTerms.message}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : t('auth_register_btn')}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            {t('auth_have_account')}{' '}
            <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
              {t('auth_signin_now')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
