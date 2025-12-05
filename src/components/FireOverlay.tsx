import React, { useEffect, useState } from 'react';

interface FireParticle {
    id: number;
    left: string;
    top: string;
    animationDuration: string;
    animationDelay: string;
    fontSize: string;
}

export const FireOverlay: React.FC = () => {
    const [particles, setParticles] = useState<FireParticle[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animationDuration: `${0.5 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${2 + Math.random() * 3}rem`,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-fire-emoji opacity-0"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        fontSize: particle.fontSize,
                        animationDuration: particle.animationDuration,
                        animationDelay: particle.animationDelay,
                    }}
                >
                    🔥
                </div>
            ))}
        </div>
    );
};
