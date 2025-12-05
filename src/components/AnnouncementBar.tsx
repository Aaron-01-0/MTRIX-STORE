import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface Announcement {
    id: string;
    message: string;
    link: string | null;
    type: 'info' | 'warning' | 'success';
}

const AnnouncementBar = () => {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {
        // @ts-ignore
        const { data } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
            // @ts-ignore
            setAnnouncement(data);
        }
    };

    if (!announcement || !isVisible || !announcement.message) return null;

    return (
        <div className="bg-primary text-black font-bold text-sm py-2 px-4 relative z-50">
            <div className="container mx-auto flex items-center justify-center text-center">
                {announcement.link ? (
                    <Link to={announcement.link} className="hover:underline">
                        {announcement.message}
                    </Link>
                ) : (
                    <span>{announcement.message}</span>
                )}

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default AnnouncementBar;
