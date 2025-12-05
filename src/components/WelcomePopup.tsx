import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WelcomePopup = () => {
    const [isOpen, setIsOpen] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleClose = () => {
        // Play audio on close button click (user interaction satisfies browser autoplay policy)
        if (!audioRef.current) {
            audioRef.current = new Audio("/amongus.mp3");
        }
        audioRef.current.play();

        setIsOpen(false);
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
