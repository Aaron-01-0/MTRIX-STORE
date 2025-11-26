import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PromotionsStrip = () => {
  const [promotions, setPromotions] = useState<string[]>([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_strips')
        .select('text')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPromotions(data?.map(p => p.text) || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  if (promotions.length === 0) return null;

  return (
    <div className="bg-black border-t border-white/10 py-3 overflow-hidden relative z-40">
      <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
        {/* Repeat the content enough times to ensure smooth scrolling */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center mx-4">
            {promotions.map((promo, index) => (
              <div key={`${i}-${index}`} className="flex items-center">
                <span className="text-white/90 font-medium text-sm font-mono uppercase tracking-widest px-8">
                  {promo}
                </span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full opacity-80" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsStrip;