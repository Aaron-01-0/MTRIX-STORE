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
                navigate('/', { replace: true });
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

        navigate('/'); // Go to Dashboard/Home
    };

    return (
        <>
            {step === 'prologue' && <Prologue onComplete={handlePrologueComplete} />}
            {step === 'galaxy' && <WishGalaxy onComplete={handleGalaxyComplete} />}
            {step === 'wheel' && <RewardWheel onComplete={handleWheelComplete} />}
        </>
    );
};

export default Onboarding;
