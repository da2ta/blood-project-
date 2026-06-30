import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/notificationStore';
import { ROUTES } from '../constants';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        addToast({ type: 'error', title: 'Error', message: error.message });
        return;
      }

      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been reset successfully.',
      });

      navigate(ROUTES.LOGIN);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to reset password' });
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
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-400">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
            {...register('password')}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
            {...register('confirmPassword')}
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
