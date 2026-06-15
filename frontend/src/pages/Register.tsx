import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore.js';
import Input from '../components/ui/Input.js';
import Button from '../components/ui/Button.js';

const registerSchema = zod.object({
  username: zod
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric characters & underscores only'),
  password: zod
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

type RegisterFormValues = zod.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await signup(values.username, values.password);
      navigate('/chats');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[420px] p-8 rounded-2xl bg-surface border border-border/80 shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-5 h-5 rounded-full bg-accent"></div>
          <span className="font-mono text-base font-bold tracking-[0.25em] text-primaryText">
            ALIAS
          </span>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-primaryText">
            CREATE ACCOUNT
          </h2>
          <p className="text-xs text-secondaryText mt-1.5 font-mono uppercase tracking-wider">
            Create a new anonymous profile
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-900/60 text-red-400 text-xs font-mono uppercase tracking-tight">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Username"
            type="text"
            placeholder="shadowbyte"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-2 font-mono uppercase"
          >
            REGISTER
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-border/60 pt-6">
          <span className="text-xs text-secondaryText font-mono">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link
              to="/login"
              onClick={clearError}
              className="text-accent hover:underline font-bold uppercase ml-1"
            >
              LOGIN
            </Link>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
