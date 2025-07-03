
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/tesla-ui.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'inspector' | 'consultant' | 'engineer'>('inspector');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectUserBasedOnRole(user.id);
    }
  }, [user, navigate]);

  const redirectUserBasedOnRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile) {
        switch (profile.role) {
          case 'inspector':
            navigate('/field-inspector/dashboard');
            break;
          case 'consultant':
            navigate('/workflow');
            break;
          case 'engineer':
            navigate('/workflow');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      navigate('/dashboard');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully!');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast.error(error.message);
      } else {
        // Create user profile with role
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: newUser.id,
              email: email,
              full_name: fullName,
              role: role
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
        
        toast.success('Account created! Please check your email to confirm your account.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An error occurred during signup');
    }
    
    setLoading(false);
  };

  return (
    <div className="tesla-dark min-h-screen tesla-scrollbar">
      {/* Tesla-Style Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-tesla-bg-primary via-tesla-bg-secondary to-tesla-bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 tesla-glass-card mb-4 tesla-glow">
              <svg 
                className="w-8 h-8 text-tesla-blue" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="tesla-h2 mb-2">SOW Genesis</h1>
            <p className="tesla-body text-tesla-text-secondary">
              Professional Roofing Workflow Platform
            </p>
          </div>

          <Card className="tesla-glass-card border-tesla-surface">
            <CardHeader>
              <CardTitle className="tesla-h3">Authentication</CardTitle>
              <CardDescription className="tesla-small text-tesla-text-muted">
                Access your multi-role roofing projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="tesla-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="tesla-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-tesla-blue hover:bg-tesla-blue-light"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="tesla-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="tesla-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="tesla-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-select">Role</Label>
                      <Select value={role} onValueChange={(value: 'inspector' | 'consultant' | 'engineer') => setRole(value)}>
                        <SelectTrigger id="role-select" className="tesla-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inspector">Field Inspector</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                          <SelectItem value="engineer">Engineer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-tesla-success hover:bg-tesla-success/90"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              {/* Test Account Info */}
              <div className="mt-6 p-4 tesla-glass-card border border-tesla-surface">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-tesla-blue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="tesla-body font-medium text-tesla-text-primary">Test Account</span>
                </div>
                <p className="tesla-small text-tesla-text-secondary mb-2">
                  Use this account for testing both inspector and engineer features:
                </p>
                <div className="space-y-1">
                  <p className="tesla-body font-mono text-tesla-text-primary">
                    kidderswork@gmail.com
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs tesla-glass-card border border-tesla-blue text-tesla-blue">
                      Inspector Access
                    </span>
                    <span className="px-2 py-1 text-xs tesla-glass-card border border-tesla-purple text-tesla-purple">
                      Engineer Access
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-tesla-text-muted hover:text-tesla-text-primary"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
