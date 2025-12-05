import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useState, useRef } from "react";
import { FireOverlay } from "@/components/FireOverlay";
import { FireButton } from "@/components/FireButton";
import { WelcomePopup } from "@/components/WelcomePopup";
import "./fire.css";

const queryClient = new QueryClient();

const App = () => {
  const [isFireActive, setIsFireActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFireClick = () => {
    setIsFireActive(true);
    if (!audioRef.current) {
      audioRef.current = new Audio("/maka-bhosda-aag-meme-amitabh-bachan-made-with-Voicemod.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(e => console.error("Audio play failed:", e));

    setTimeout(() => {
      setIsFireActive(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 10000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pothole-hero-theme">
        <TooltipProvider>
          <SpeedInsights />
          <Toaster />
          <Sonner />
          <WelcomePopup />
          {isFireActive && <FireOverlay />}
          <FireButton onClick={handleFireClick} isActive={isFireActive} />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
