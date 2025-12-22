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

    const submitWish = async (message: string, name?: string, email: string) => {
        try {
            // Check if message is empty
            if (!message.trim()) return { error: 'Message cannot be empty' };
            if (!email.trim()) return { error: 'Email cannot be empty' };

            // If name is not provided, use email or 'Anonymous' logic on display side. 
            // DB requires name? Let's check schema/types or just pass email as name if missing?
            // The prompt says "show email id" if name not found. 
            // We can pass empty string if column allows, or duplicate email.
            // Let's pass what we have.
            const nameToSave = name && name.trim() ? name : email;

            const { data, error } = await supabase
                .from('wishes')
                .insert([{ message, name: nameToSave, email } as any]) // Cast to any to assume email column exists/is handled
                .select()
                .single();

            if (error) throw error;

            // Optimistic update
            if (data && data.is_approved) {
                setWishes(prev => [data as Wish, ...prev]);
            }

            return { success: true, wish: data };
        } catch (error) {
            console.error('Error submitting wish:', error);
            return { error: 'Failed to submit wish' };
        }
    };

    const checkWishByEmail = async (email: string) => {
        try {
            const { data, error } = await supabase
                .from('wishes')
                .select('*')
                .eq('email', email)
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
            return { wish: data };
        } catch (error) {
            console.error('Error checking wish:', error);
            return { error: 'Failed to check wish' };
        }
    };

    return { wishes, loading, submitWish, checkWishByEmail };
};
