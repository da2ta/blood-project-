import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '../components/ui/glass-card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  const { initialize } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Login failed',
          message: error.message,
        });
        return;
      }

      // Re-initialize auth store to fetch user profile
      await initialize();

      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have been signed in successfully.',
      });

      navigate(ROUTES.DASHBOARD);
    } catch {
      addToast({
        type: 'error',
        title: 'Login failed',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="p-2 shadow-2xl">
        <GlassCardHeader className="text-center mb-4">
          <GlassCardTitle className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</GlassCardTitle>
          <GlassCardDescription className="text-slate-400 text-center">Sign in to your HemoExchange account</GlassCardDescription>
        </GlassCardHeader>

        <GlassCardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 [&_label]:!text-slate-300">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@hospital.org"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
            {...register('email')}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
              {...register('password')}
            />
            <div className="mt-2 text-right">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign In
          </Button>
        </form>
        </GlassCardContent>

        <GlassCardFooter className="mt-2 text-center justify-center">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Register your hospital
            </Link>
          </p>
        </GlassCardFooter>
      </GlassCard>
    </motion.div>
  );
}
