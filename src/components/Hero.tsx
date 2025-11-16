import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-10" />
      
      <div className="container mx-auto px-4 py-16 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent animate-fade-in">
            Report Road Potholes
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Help make Bangalore's roads safer. Report potholes in your area and we'll notify BBMP directly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="group shadow-[var(--shadow-elevated)] hover:scale-105 transition-transform"
            >
              Report a Pothole
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            >
              View Recent Reports
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)] border hover:shadow-[var(--shadow-elevated)] transition-shadow">
              <div className="text-3xl mb-2">📸</div>
              <h3 className="font-semibold mb-2">Take a Photo</h3>
              <p className="text-sm text-muted-foreground">Upload a clear image of the pothole</p>
            </div>
            
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)] border hover:shadow-[var(--shadow-elevated)] transition-shadow">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-semibold mb-2">Mark Location</h3>
              <p className="text-sm text-muted-foreground">Pin the exact location on the map</p>
            </div>
            
            <div className="p-6 rounded-lg bg-card shadow-[var(--shadow-card)] border hover:shadow-[var(--shadow-elevated)] transition-shadow">
              <div className="text-3xl mb-2">✉️</div>
              <h3 className="font-semibold mb-2">Submit Report</h3>
              <p className="text-sm text-muted-foreground">We'll help you email BBMP directly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;