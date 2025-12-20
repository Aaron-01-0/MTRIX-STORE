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

    // Protect route
    useEffect(() => {
        if (!user) {
            // If not logged in, redirect to auth
            // navigate('/auth'); // Commented out for dev testing
        }
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
        if (user) {
            /* 
            await supabase.from('profiles').update({ 
                onboarding_completed: true 
            }).eq('id', user.id);
            */
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
