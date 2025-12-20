import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Wish {
    id: string;
    message: string;
    created_at: string;
    is_approved: boolean;
    name?: string;
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
                    setWishes(prev => {
                        // Prevent duplicates if optimistic update already added it
                        if (prev.some(w => w.id === newWish.id)) return prev;
                        return [newWish, ...prev];
                    });
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
                .select('id, message, created_at, is_approved, name')
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

    const submitWish = async (message: string, name: string, email: string) => {
        try {
            // Check if message is empty
            if (!message.trim()) return { error: 'Message cannot be empty' };
            if (!name.trim()) return { error: 'Name cannot be empty' };
            if (!email.trim()) return { error: 'Email cannot be empty' };

            const { data, error } = await supabase
                .from('wishes')
                .insert([{ message, name, email }])
                .select()
                .single();

            if (error) throw error;

            // Optimistic update
            if (data && data.is_approved) {
                setWishes(prev => [data as Wish, ...prev]);
            }

            return { success: true };
        } catch (error) {
            console.error('Error submitting wish:', error);
            return { error: 'Failed to submit wish' };
        }
    };

    return { wishes, loading, submitWish };
};
