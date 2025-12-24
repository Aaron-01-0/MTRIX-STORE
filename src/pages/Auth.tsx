import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Phone, ArrowRight, Sparkles, Gift } from 'lucide-react';
import { signUpSchema, signInSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

// --- Christmas Audio Component (Local for now to ensure persistence in this view) ---
const ChristmasAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Auto-play attempt on mount
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0.1; // Reduced volume per user feedback
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Autoplay blocked, waiting for interaction");
        }
      }
    };
    playAudio();
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <audio
        ref={audioRef}
        src="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=christmas-magic-14222.mp3"
        loop
      />
      <button
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all duration-300 ${isPlaying ? 'bg-mtrix-gold/20 text-mtrix-gold animate-pulse' : 'bg-black/40 text-gray-400'
          }`}
      >
        {isPlaying ? (
          <div className="flex gap-1 h-4 items-end">
            <div className="w-1 bg-mtrix-gold animate-[bounce_1s_infinite] h-full" />
            <div className="w-1 bg-mtrix-gold animate-[bounce_1.2s_infinite] h-2/3" />
            <div className="w-1 bg-mtrix-gold animate-[bounce_0.8s_infinite] h-full" />
          </div>
        ) : (
          <div className="w-0 h-0 border-l-[12px] border-l-current border-y-[8px] border-y-transparent ml-1" />
        )}
      </button>
    </div>
  );
};

// --- Snowfall Effect ---
const Snowfall = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const snowflakes: { x: number; y: number; radius: number; speed: number; opacity: number }[] = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'white';

      snowflakes.forEach((flake) => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();

        flake.y += flake.speed;
        flake.x += Math.sin(flake.y / 50) * 0.5;

        if (flake.y > height) {
          flake.y = 0;
          flake.x = Math.random() * width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  const [isSuccess, setIsSuccess] = useState(false); // For split animation

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
    if (user && !isSuccess) {
      // If already logged in, just go
      navigate('/');
    }
  }, [user, navigate, isSuccess]);

  const onAuthSuccess = async () => {
    setIsSuccess(true);

    // Check if user has completed onboarding
    let hasCompleted = false;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();
      if (data?.has_completed_onboarding) hasCompleted = true;
    }

    setTimeout(() => {
      if (hasCompleted) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    }, 1500); // Wait for split animation
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signInSchema.safeParse({ email: signInData.identifier, password: signInData.password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(signInData.identifier.trim(), signInData.password);
      if (error) {
        logger.error('Sign in failed', error);
        // Show specific error if available (e.g. Email not confirmed)
        toast.error(error.message || 'Invalid credentials. Please try again.');
      } else {
        toast.success('Welcome back!');
        onAuthSuccess();
      }
    } catch (error) {
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
        toast.error(error.message || 'Failed to create account');
      } else {
        toast.success('Account created! Please check your email.');

        // Trigger Welcome Email (Edge Function)
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: signUpData.email,
              name: `${signUpData.firstName} ${signUpData.lastName}`
            }
          });
        } catch (err) {
          console.error("Failed to send welcome email", err);
        }

        // Show verification UI
        setVerificationSent(true);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) toast.error(error.message || 'Failed to sign in with Google');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      <ChristmasAudio />
      <Snowfall />

      {/* Split Animation Container */}
      <AnimatePresence>
        {isSuccess && (
          <>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-1/2 bg-black z-50 border-r border-mtrix-gold/50"
            />
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 w-1/2 bg-black z-50 border-l border-mtrix-gold/50"
            />
          </>
        )}
      </AnimatePresence>

      {/* Content wrapper that fades out on success */}
      <motion.div
        className="w-full flex h-screen"
        animate={{ opacity: isSuccess ? 0 : 1, scale: isSuccess ? 1.1 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left Side - Visual */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-transparent">
          {/* Dynamic Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

          <div className="relative z-10 p-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              {/* Neon Glow around text */}
              <div className="absolute -inset-10 bg-mtrix-gold/10 blur-[100px] rounded-full animate-pulse" />

              <h1 className="text-7xl font-black font-orbitron tracking-tighter text-white mb-2 drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]">
                MTRIX
              </h1>
              <div className="flex items-center justify-center gap-4 text-2xl font-light tracking-[0.5em] text-mtrix-gold/80 mb-8">
                <span>CHRISTMAS</span>
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
                <span>DROP</span>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-mtrix-gold/50 to-transparent my-8" />

              <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed font-light">
                The wait is over. <br />
                <span className="text-white font-medium">Unwrap the future of street culture.</span>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-20">
          {/* Mobile BG */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 lg:hidden" />
          <div className="absolute inset-0 bg-black/80 lg:hidden" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative"
          >
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-4xl font-black font-orbitron tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                MTRIX
              </h1>
              <p className="text-gold text-xs tracking-[0.3em] mt-2">CHRISTMAS DROP</p>
            </div>

            <Card className="border-mtrix-gold/20 bg-black/60 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              {/* Border Gradient Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-mtrix-gold/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[1.5s]" />

              {verificationSent ? (
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-mtrix-gold/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Mail className="w-10 h-10 text-mtrix-gold" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black font-orbitron text-white">CHECK INBOX</h2>
                    <p className="text-gray-400">
                      We've sent a verification link to <br />
                      <span className="text-white font-medium">{signUpData.email}</span>
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
                    <p>Click the link in the email to activate your account. Then return here to login.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setVerificationSent(false);
                      setActiveTab('signin');
                    }}
                    className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-gray-300 font-orbitron tracking-wider"
                  >
                    RETURN TO LOGIN
                  </Button>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
                  <div className="p-6 pb-0">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/5">
                      <TabsTrigger
                        value="signin"
                        className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-bold font-orbitron tracking-wide transition-all duration-300"
                      >
                        LOGIN
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-bold font-orbitron tracking-wide transition-all duration-300"
                      >
                        JOIN
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                    <TabsContent value="signin" className="mt-0">
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold text-white text-center font-orbitron">Welcome Back</CardTitle>
                          <CardDescription className="text-gray-400 text-center flex items-center justify-center gap-2">
                            <Gift className="w-4 h-4 text-red-500" /> Your rewards are waiting
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <form onSubmit={handleSignIn} className="space-y-4">
                            <div className="space-y-2">
                              {/* <Label className="text-xs uppercase text-mtrix-gold/70 tracking-wider">Email or Mobile</Label> */}
                              <div className="relative group">
                                <Input
                                  type="text"
                                  placeholder="Email or Mobile"
                                  value={signInData.identifier}
                                  onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
                                  className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:border-mtrix-gold focus:ring-1 focus:ring-mtrix-gold/50 transition-all rounded-lg placeholder:text-gray-600"
                                  required
                                />
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500 group-hover:text-mtrix-gold transition-colors" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="relative group">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password"
                                  value={signInData.password}
                                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                                  className="pl-4 pr-10 h-12 bg-white/5 border-white/10 text-white focus:border-mtrix-gold focus:ring-1 focus:ring-mtrix-gold/50 transition-all rounded-lg placeholder:text-gray-600"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>

                            <Button
                              type="submit"
                              className="w-full h-12 bg-gradient-to-r from-mtrix-gold via-yellow-400 to-mtrix-gold hover:from-yellow-300 hover:to-yellow-500 text-black font-black font-orbitron text-lg tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300 border-none"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 animate-spin" /> LOAD...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  UNLOCK MATRIX <ArrowRight className="w-5 h-5" />
                                </span>
                              )}
                            </Button>
                          </form>

                          {/* Google Login */}
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                              <span className="bg-black/80 backdrop-blur-sm px-2 text-gray-500">Or Access With</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-12 font-medium tracking-wide"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                          >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google" />
                            Google
                          </Button>
                        </CardContent>
                      </motion.div>
                    </TabsContent>

                    {/* Sign Up Tab - Similar Styling */}
                    <TabsContent value="signup" className="mt-0">
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold text-white text-center font-orbitron">Join The Elite</CardTitle>
                          <CardDescription className="text-gray-400 text-center">
                            Start your journey
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <form onSubmit={handleSignUp} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                              <Input placeholder="First Name" value={signUpData.firstName} onChange={e => setSignUpData({ ...signUpData, firstName: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />
                              <Input placeholder="Last Name" value={signUpData.lastName} onChange={e => setSignUpData({ ...signUpData, lastName: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />
                            </div>

                            <Input type="email" placeholder="Email Address" value={signUpData.email} onChange={e => setSignUpData({ ...signUpData, email: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />

                            <Input type="tel" placeholder="Mobile" value={signUpData.mobileNo} onChange={e => setSignUpData({ ...signUpData, mobileNo: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />

                            <Input type="password" placeholder="Password" value={signUpData.password} onChange={e => setSignUpData({ ...signUpData, password: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />

                            <Input type="password" placeholder="Confirm Password" value={signUpData.confirmPassword} onChange={e => setSignUpData({ ...signUpData, confirmPassword: e.target.value })} className="bg-white/5 border-white/10 focus:border-mtrix-gold text-white" required />

                            <Button
                              type="submit"
                              className="w-full h-12 bg-gradient-to-r from-mtrix-gold via-yellow-400 to-mtrix-gold hover:from-yellow-300 hover:to-yellow-500 text-black font-black font-orbitron text-lg tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.3)] border-none"
                              disabled={isLoading}
                            >
                              {isLoading ? 'CREATING...' : 'INITIATE'}
                            </Button>
                          </form>
                        </CardContent>
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;