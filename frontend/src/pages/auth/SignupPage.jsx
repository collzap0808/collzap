import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import { useAuthStore } from '../../store/useAuthStore';
import { page, useReducedMotion, transition } from '../../lib/motion';

export default function SignupPage() {
  const location = useLocation();
  const [name, setName] = useState('');
  // Carried over from the email box on the landing hero, if they used it.
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const clear = (field) => setErrors((p) => ({ ...p, [field]: undefined }));

  const { signup, loading } = useAuthStore();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = 'Enter your name';
    if (!email.trim()) next.email = 'Enter your email';
    if (!password) next.password = 'Choose a password';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (password && password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await signup(email, password, name);
      // Every fresh signup lands on VERIFY_EMAIL first.
      navigate('/onboarding', { replace: true });
    } catch (error) {
      // A 400 validation failure names the offending field (e.g. a too-common
      // password) — show it under that field instead of a generic toast.
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
        return;
      }
      toast.error(error.message || 'Could not create your account');
    }
  };

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition(page, reduced)}
    >
      <Helmet>
        <title>Sign up · CollZap</title>
        <meta name="description" content="Join CollZap and find verified students at your college who share your interests and goals." />
        {/* robots meta is owned solely by App.jsx — see its comment for why */}
        <link rel="canonical" href="https://collzap.com/signup" />
      </Helmet>

      <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tightest text-ink">
        Get on the list.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-mute">
        Use any email to create your account. You'll verify your college next.
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-3">
        <Input
          label="Your name"
          value={name}
          onChange={(e) => { setName(e.target.value); clear('name'); }}
          error={errors.name}
          autoComplete="name"
          disabled={loading}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clear('email'); }}
          error={errors.email}
          autoComplete="email"
          disabled={loading}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clear('password'); }}
          error={errors.password}
          autoComplete="new-password"
          hint="At least 8 characters"
          disabled={loading}
        />

        <PasswordInput
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clear('confirmPassword'); }}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={loading}
        />

        <Button type="submit" variant="gradient" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <div className="mt-8 border-t border-line pt-5">
        <button
          type="button"
          className="text-sm text-mute hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Already have an account?{' '}
          <span className="font-medium text-accent-700 underline underline-offset-4 decoration-accent-300">
            Log in
          </span>
        </button>
      </div>
    </motion.div>
  );
}
