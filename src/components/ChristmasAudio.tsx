import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

// Using a publicly available royalty-free Christmas Lofi track for demo
// You can replace this with a local file in public/ e.g. "/christmas-lofi.mp3"
const AUDIO_URL = "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=lofi-christmas-127393.mp3";

const ChristmasAudio = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Auto-play attempt
        const playAudio = async () => {
            if (audioRef.current) {
                audioRef.current.volume = 0.3; // Low volume background
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.log("Autoplay prevented by browser", err);
                }
            }
        };
        playAudio();
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <audio ref={audioRef} src={AUDIO_URL} loop />
            <Button
                variant="outline"
                size="icon"
                onClick={togglePlay}
                className={cn(
                    "rounded-full w-12 h-12 border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10 transition-all duration-500",
                    isPlaying && "border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse-slow"
                )}
            >
                {isPlaying ? (
                    <Volume2 className="w-5 h-5 text-gold" />
                ) : (
                    <VolumeX className="w-5 h-5 text-neutral-400" />
                )}
            </Button>
        </div>
    );
};

export default ChristmasAudio;
