import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '../../../api/auth';
import useAuthStore from '../../../store/authStore';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { KeyRound, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@example.com',
      password: 'password123'
    }
  });

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.data, data.data.token);
      navigate('/app/dashboard');
    },
    onError: (error) => {
      console.error(error);
      alert(error.response?.data?.message || 'Login failed. Make sure server is running and database is seeded.');
    }
  });

  const fillDemo = () => {
    setValue('email', 'admin@example.com');
    setValue('password', 'password123');
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Enter your credentials to access your account</p>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center justify-between text-xs text-primary-900">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary-600 shrink-0" />
          <span>Demo Account Available</span>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="font-semibold text-primary-700 hover:text-primary-900 underline flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" /> Auto-fill Demo
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input type="email" placeholder="admin@example.com" {...register('email')} error={errors.email} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <Input type="password" placeholder="••••••••" {...register('password')} error={errors.password} />
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Sign in
        </Button>
      </form>
      
      <p className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          Sign up
        </Link>
      </p>
    </div>
  );
};

