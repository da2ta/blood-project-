import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  FileText,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useRegister } from '../api/auth.api';
import { useNotificationStore } from '../store/notificationStore';
import { ROUTES, HOSPITAL_TYPES, INDIAN_STATES } from '../constants';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  hospitalName: z.string().min(2, 'Hospital name is required').max(200),
  registrationNumber: z.string().min(3, 'Registration number is required').max(50),
  hospitalType: z.enum(['Government', 'Private', 'Medical College']),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  phone: z.string().regex(/^[+]?\d{10,13}$/, 'Invalid phone number'),
  hospitalEmail: z.string().email('Invalid hospital email'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, title: 'Admin Account', description: 'Your personal details' },
  { id: 2, title: 'Hospital Info', description: 'Organization details' },
  { id: 3, title: 'Location & Contact', description: 'Address information' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  const registerMutation = useRegister();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      hospitalName: '',
      registrationNumber: '',
      hospitalType: 'Government',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      hospitalEmail: '',
      website: '',
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email', 'password', 'confirmPassword'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['hospitalName', 'registrationNumber', 'hospitalType'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...submitData } = data;
      const result = await registerMutation.mutateAsync(submitData);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Registration Successful!',
          message: 'Your hospital registration is pending approval. You will be notified once approved.',
          duration: 8000,
        });
        navigate(ROUTES.LOGIN);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message,
      });
    }
  };

  const inputClasses = '!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500';
  const labelClasses = '[&_label]:!text-slate-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Register Your Hospital</h1>
          <p className="text-slate-400">Join India&apos;s blood exchange network</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${currentStep >= step.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/10 text-slate-400 border border-white/10'
                    }
                  `}
                >
                  {step.id}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 hidden sm:block">{step.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Admin Account */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`space-y-4 ${labelClasses}`}
              >
                <Input
                  label="Your Full Name"
                  placeholder="Dr. John Smith"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  className={inputClasses}
                  {...register('name')}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@hospital.org"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  className={inputClasses}
                  {...register('email')}
                />
                <Input
                  label="Password"
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
                  className={inputClasses}
                  {...register('password')}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.confirmPassword?.message}
                  className={inputClasses}
                  {...register('confirmPassword')}
                />
              </motion.div>
            )}

            {/* Step 2: Hospital Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`space-y-4 ${labelClasses}`}
              >
                <Input
                  label="Hospital Name"
                  placeholder="City General Hospital"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  error={errors.hospitalName?.message}
                  className={inputClasses}
                  {...register('hospitalName')}
                />
                <Input
                  label="Registration Number"
                  placeholder="MCI/REG/12345"
                  leftIcon={<FileText className="w-4 h-4" />}
                  error={errors.registrationNumber?.message}
                  className={inputClasses}
                  {...register('registrationNumber')}
                />
                <div className={labelClasses}>
                  <Select
                    label="Hospital Type"
                    options={HOSPITAL_TYPES.map((t) => ({ value: t, label: t }))}
                    error={errors.hospitalType?.message}
                    className={`${inputClasses} [&_option]:text-slate-900`}
                    {...register('hospitalType')}
                  />
                </div>
                <Input
                  label="Hospital Email"
                  type="email"
                  placeholder="admin@hospital.org"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.hospitalEmail?.message}
                  className={inputClasses}
                  {...register('hospitalEmail')}
                />
                <Input
                  label="Website (Optional)"
                  placeholder="https://www.hospital.org"
                  leftIcon={<Globe className="w-4 h-4" />}
                  error={errors.website?.message}
                  className={inputClasses}
                  {...register('website')}
                />
              </motion.div>
            )}

            {/* Step 3: Location & Contact */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`space-y-4 ${labelClasses}`}
              >
                <Input
                  label="Address"
                  placeholder="123 Medical Lane"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  error={errors.address?.message}
                  className={inputClasses}
                  {...register('address')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="Mumbai"
                    error={errors.city?.message}
                    className={inputClasses}
                    {...register('city')}
                  />
                  <div className={labelClasses}>
                    <Select
                      label="State"
                      options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                      placeholder="Select state"
                      error={errors.state?.message}
                      className={`${inputClasses} [&_option]:text-slate-900`}
                      {...register('state')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pincode"
                    placeholder="400001"
                    error={errors.pincode?.message}
                    className={inputClasses}
                    {...register('pincode')}
                  />
                  <Input
                    label="Phone"
                    placeholder="+919876543210"
                    leftIcon={<Phone className="w-4 h-4" />}
                    error={errors.phone?.message}
                    className={inputClasses}
                    {...register('phone')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="!text-slate-300"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={registerMutation.isPending}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Register Hospital
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
