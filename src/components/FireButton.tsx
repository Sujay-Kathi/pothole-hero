import React from 'react';
import { Flame } from 'lucide-react';
import { Button } from './ui/button';

interface FireButtonProps {
    onClick: () => void;
    isActive: boolean;
}

export const FireButton: React.FC<FireButtonProps> = ({ onClick, isActive }) => {
    return (
        <Button
            onClick={onClick}
            className={`fixed bottom-4 left-4 z-50 rounded-full p-4 transition-all duration-300 shadow-lg hover:shadow-orange-500/50 ${isActive
                    ? 'bg-orange-600 scale-110 animate-pulse ring-4 ring-orange-400 ring-opacity-50'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
            size="icon"
            disabled={isActive}
            aria-label="Activate Fire Mode"
        >
            <Flame className={`h-6 w-6 text-white ${isActive ? 'animate-bounce' : ''}`} />
        </Button>
    );
};
