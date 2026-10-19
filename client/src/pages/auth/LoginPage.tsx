import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
      const res = await authApi.login(data);
      login(res.data.user);
      toast.success('Welcome back! ❤️');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('error_generic');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      {/* Background */}
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
        {/* Card */}
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('auth_login_title')}</h1>
            <p className="text-white/50 mt-2 text-sm">{t('auth_login_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label-text">{t('auth_email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('email')}
                  type="email"
                  className="input-field ps-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : t('auth_login_btn')}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-white/50 text-sm mt-6">
            {t('auth_no_account')}{' '}
            <Link to="/register" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
              {t('auth_create_one')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
