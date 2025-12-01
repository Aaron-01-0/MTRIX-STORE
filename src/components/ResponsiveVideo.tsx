import { cn } from "@/lib/utils";

interface ResponsiveVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src?: string;
    poster?: string;
    aspectRatio?: "video" | "reel" | "square";
    type?: "native" | "youtube" | "vimeo";
    embedId?: string; // For YouTube/Vimeo
}

export const ResponsiveVideo = ({
    src,
    poster,
    className,
    aspectRatio = "video",
    type = "native",
    embedId,
    ...props
}: ResponsiveVideoProps) => {

    const aspectRatioClasses = {
        video: "aspect-video", // 16:9
        reel: "aspect-[9/16]", // 9:16 (TikTok/Reels style)
        square: "aspect-square" // 1:1
    };

    const containerClasses = cn(
        "relative w-full overflow-hidden bg-black rounded-lg",
        aspectRatioClasses[aspectRatio],
        className
    );

    if (type === "youtube" && embedId) {
        return (
            <div className={containerClasses}>
                <iframe
                    src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${embedId}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&vq=hd1080`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full border-0 pointer-events-none scale-150"
                />
            </div>
        );
    }

    if (type === "vimeo" && embedId) {
        return (
            <div className={containerClasses}>
                <iframe
                    src={`https://player.vimeo.com/video/${embedId}`}
                    title="Vimeo video player"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full border-0"
                />
            </div>
        );
    }

    // Native Video
    return (
        <div className={containerClasses}>
            <video
                src={src}
                poster={poster}
                className="absolute top-0 left-0 w-full h-full object-cover"
                // controls
                playsInline
                {...props}
            />
        </div>
    );
};
