import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../../../api/auth';
import useAuthStore from '../../../store/authStore';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional(),
});

export const RegisterForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data.data, data.data.token);
      navigate('/app/dashboard');
    },
    onError: (error) => {
      console.error(error);
      alert(error.response?.data?.message || 'Registration failed');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Create an account</h2>
        <p className="mt-2 text-sm text-slate-600">Start finding and reaching better leads</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <Input type="text" placeholder="John Doe" {...register('name')} error={errors.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input type="email" placeholder="you@company.com" {...register('email')} error={errors.email} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <Input type="password" placeholder="••••••••" {...register('password')} error={errors.password} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company (Optional)</label>
            <Input type="text" placeholder="Acme Inc" {...register('company')} error={errors.company} />
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create account
        </Button>
      </form>
      
      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </div>
  );
};
