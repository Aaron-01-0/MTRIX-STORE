import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Wish {
    id: string;
    message: string;
    created_at: string;
    is_approved: boolean;
}

export const useWishes = () => {
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishes();

        const channel = supabase
            .channel('public:wishes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
                const newWish = payload.new as Wish;
                if (newWish.is_approved) {
                    setWishes(prev => [newWish, ...prev]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchWishes = async () => {
        try {
            const { data, error } = await supabase
                .from('wishes')
                .select('*')
                .eq('is_approved', true) // Default true in DB migration
                .order('created_at', { ascending: false })
                .limit(50); // Fetch last 50 wishes

            if (error) throw error;
            setWishes(data as Wish[]);
        } catch (error) {
            console.error('Error fetching wishes:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitWish = async (message: string) => {
        try {
            // Check if message is empty
            if (!message.trim()) return { error: 'Message cannot be empty' };

            const { error } = await supabase
                .from('wishes')
                .insert([{ message }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error submitting wish:', error);
            return { error: 'Failed to submit wish' };
        }
    };

    return { wishes, loading, submitWish };
};
