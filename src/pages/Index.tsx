import { useState } from "react";
import Hero from "@/components/Hero";
import ReportForm from "@/components/ReportForm";
import RecentReports from "@/components/RecentReports";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  const handleReportSuccess = (reportData: any) => {
    // Generate email content
    const subject = `Pothole Report - ${reportData.area_name}`;
    const body = `Dear BBMP Team,

I am reporting a pothole that needs urgent attention in ${reportData.area_name}.

Location Details:
- Area: ${reportData.area_name}
- Address: ${reportData.address}
- Coordinates: ${reportData.latitude}, ${reportData.longitude}
- Duration: ${reportData.duration.replace(/-/g, ' ')}

${reportData.description ? `Additional Details:\n${reportData.description}\n\n` : ''}
Image Evidence: ${reportData.image_url}

This pothole poses a safety hazard to commuters. I request immediate action to repair this road damage.

Thank you for your attention to this matter.

Best regards`;

    // Create mailto link
    const mailtoLink = `mailto:comm@bbmp.gov.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open mailto link
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                PH
              </div>
              <h1 className="text-xl font-bold">Pothole Hero</h1>
            </div>
            {showForm && (
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!showForm ? (
          <>
            <Hero onGetStarted={() => setShowForm(true)} />
            <RecentReports />
          </>
        ) : (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <Card className="p-8 shadow-[var(--shadow-elevated)]">
                <ReportForm onSuccess={handleReportSuccess} />
              </Card>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Pothole Hero - Making Bangalore's roads safer, one report at a time
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Reports are sent directly to BBMP (comm@bbmp.gov.in)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;