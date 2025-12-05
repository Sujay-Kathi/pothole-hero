import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WelcomePopup = () => {
    const [isOpen, setIsOpen] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio("/amongus.mp3");

        // Attempt to play audio
        // Note: Browsers might block autoplay without user interaction.
        // We'll try to play it, but handle errors silently or log them.
        const playAudio = async () => {
            try {
                if (audioRef.current) {
                    await audioRef.current.play();
                }
            } catch (error) {
                console.log("Autoplay prevented:", error);
            }
        };

        playAudio();

        // Cleanup on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full h-8 w-8"
                    onClick={handleClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                <div className="rounded-lg overflow-hidden shadow-2xl border border-white/10">
                    <img
                        src="/pic.jpg"
                        alt="Welcome"
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>
    );
};
