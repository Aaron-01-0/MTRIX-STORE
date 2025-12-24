import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Prologue from './Prologue';
import WishGalaxy from './WishGalaxy';
import RewardWheel from './RewardWheel';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Onboarding = () => {
    const [step, setStep] = useState<'prologue' | 'galaxy' | 'wheel'>('prologue');
    const navigate = useNavigate();
    const { user } = useAuth();

    // Protect route & Check Status
    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();

            if (data?.has_completed_onboarding) {
                // navigate('/', { replace: true }); 
                // DISABLED TO PREVENT INFINITE LOOP WITH APP.TSX
                // Instead, we can show a message or just let them re-do it?
                // Or better, set a local state to show "You are already set up"
                setStep('done' as any);
            }
        };

        checkStatus();
    }, [user, navigate]);

    const handlePrologueComplete = () => {
        setStep('galaxy');
    };

    const handleGalaxyComplete = () => {
        setStep('wheel');
    };

    const handleWheelComplete = async () => {
        // Mark onboarding as done in local storage or DB
        localStorage.setItem('mtrix_onboarding_complete', 'true');

        // Optional: Update user profile if we had a column for it
        // Mark onboarding as done in DB
        if (user) {
            await supabase.from('profiles').update({
                has_completed_onboarding: true,
                has_spun_wheel: true
            }).eq('id', user.id);
        }

        // Force a page reload to clear any stale auth states if needed
        window.location.href = '/';
    };

    if (step === 'done' as any) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <h1 className="text-2xl font-bold mb-4">You're all set!</h1>
                <p className="mb-8 text-gray-400">You have already completed the onboarding.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-primary text-black font-medium rounded-full hover:bg-white transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <>
            {step === 'prologue' && <Prologue onComplete={handlePrologueComplete} />}
            {step === 'galaxy' && <WishGalaxy onComplete={handleGalaxyComplete} />}
            {step === 'wheel' && <RewardWheel onComplete={handleWheelComplete} />}
        </>
    );
};

export default Onboarding;
