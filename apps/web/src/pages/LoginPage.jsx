import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { HeartHandshake, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Church CRM</title>
        <meta name="description" content="Login to Church CRM to manage members, groups, and follow-ups" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center px-4 font-premium tracking-premium leading-premium relative overflow-hidden">
        {/* Ambient color wash background */}
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(50rem 40rem at 15% 10%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(46rem 36rem at 90% 90%, hsl(var(--secondary) / 0.16), transparent 60%), radial-gradient(40rem 30rem at 80% 0%, hsl(var(--sky) / 0.12), transparent 60%)',
          }}
        />

        <div className="relative w-full max-w-md">
          <div className="auth-card rounded-[1.75rem] p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <span className="logo-mark w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
                <HeartHandshake className="w-8 h-8 text-primary-foreground" />
              </span>
              <h1 className="text-3xl font-bold tracking-premium-tight leading-premium-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-muted-foreground mt-2 font-premium tracking-premium">
                Sign in to your Church CRM account
              </p>
            </div>

            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="pastor@church.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-10 rounded-xl bg-muted/30 text-foreground"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pl-10 rounded-xl bg-muted/30 text-foreground"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold h-12 rounded-xl btn-gradient transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : (<>Sign in <ArrowRight className="w-4 h-4" /></>)}
                </Button>
              </form>
            </CardContent>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
