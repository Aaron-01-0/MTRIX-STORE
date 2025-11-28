import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MTRIXLogo from '@/components/MTRIXLogo';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { signUpSchema, signInSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');

  // Sign in form state
  const [signInData, setSignInData] = useState({
    identifier: '',
    password: ''
  });

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    name: '',
    mobileNo: ''
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = signInSchema.safeParse({
      email: signInData.identifier,
      password: signInData.password
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(signInData.identifier.trim(), signInData.password);

      if (error) {
        logger.error('Sign in failed', error);
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      logger.error('Unexpected sign in error', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = signUpSchema.safeParse({
      ...signUpData,
      email: signUpData.email,
      password: signUpData.password,
      confirmPassword: signUpData.confirmPassword,
      firstName: signUpData.firstName,
      lastName: signUpData.lastName,
      mobileNo: signUpData.mobileNo
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(signUpData.email.trim(), signUpData.password, {
        first_name: signUpData.firstName.trim(),
        last_name: signUpData.lastName.trim(),
        name: `${signUpData.firstName.trim()} ${signUpData.lastName.trim()}`,
        mobile_no: signUpData.mobileNo
      });

      if (error) {
        logger.error('Sign up failed', error);
        toast.error(error.message || 'Failed to create account');
      } else {
        toast.success('Account created successfully! Please sign in.');
        setActiveTab('signin');
      }
    } catch (error) {
      logger.error('Unexpected sign up error', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="relative z-10 p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8 inline-block">
              <h1 className="text-6xl font-black font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-white drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                MTRIX
              </h1>
            </div>
            <h1 className="text-5xl font-black font-orbitron text-white mb-6 tracking-tight">
              ENTER THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">MTRIX</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
              Join the elite community of creators and collectors.
              Your style, your rules, your arena.
            </p>
          </motion.div>
        </div>

        {/* Floating Particles/Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black lg:hidden" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-black font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-white drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              MTRIX
            </h1>
          </div>

          <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl">
                  <TabsTrigger
                    value="signin"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black rounded-lg transition-all font-bold"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black rounded-lg transition-all font-bold"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>

              <AnimatePresence mode="wait">
                <TabsContent value="signin" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white text-center">Welcome Back</CardTitle>
                      <CardDescription className="text-gray-400 text-center">
                        Access your dashboard and rewards
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Email or Mobile</Label>
                          <div className="relative group">
                            <Input
                              type="text"
                              placeholder="Enter your identifier"
                              value={signInData.identifier}
                              onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
                              className="pl-10 bg-white/5 border-white/10 text-white focus:border-yellow-500 transition-colors"
                              required
                            />
                            {signInData.identifier.includes('@') ? (
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-hover:text-yellow-400 transition-colors" />
                            ) : (
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-hover:text-yellow-400 transition-colors" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-gray-300">Password</Label>
                            <Button variant="link" className="p-0 h-auto text-xs text-yellow-400 hover:text-yellow-300">
                              Forgot password?
                            </Button>
                          </div>
                          <div className="relative group">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signInData.password}
                              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                              className="bg-white/5 border-white/10 text-white focus:border-yellow-500 transition-colors pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-6"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Sign In <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-black px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white py-6"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </Button>
                    </CardContent>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white text-center">Create Account</CardTitle>
                      <CardDescription className="text-gray-400 text-center">
                        Join the revolution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">First Name</Label>
                            <Input
                              placeholder="John"
                              value={signUpData.firstName}
                              onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                              className="bg-white/5 border-white/10 text-white focus:border-yellow-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Last Name</Label>
                            <Input
                              placeholder="Doe"
                              value={signUpData.lastName}
                              onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                              className="bg-white/5 border-white/10 text-white focus:border-yellow-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300">Email</Label>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                            className="bg-white/5 border-white/10 text-white focus:border-yellow-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300">Mobile Number</Label>
                          <Input
                            type="tel"
                            placeholder="9876543210"
                            value={signUpData.mobileNo}
                            onChange={(e) => setSignUpData({ ...signUpData, mobileNo: e.target.value })}
                            className="bg-white/5 border-white/10 text-white focus:border-yellow-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300">Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={signUpData.password}
                              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                              className="bg-white/5 border-white/10 text-white focus:border-yellow-500 pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              value={signUpData.confirmPassword}
                              onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                              className="bg-white/5 border-white/10 text-white focus:border-yellow-500 pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-6"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </form>
                    </CardContent>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;