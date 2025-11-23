import { useState, useEffect, useRef } from "react";
import Hero from "@/components/Hero";
import ReportForm from "@/components/ReportForm";
import RecentReports, { RecentReportsHandles } from "@/components/RecentReports";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Report } from "@/types/report";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScrollHeader } from "@/hooks/use-scroll-header";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [pendingReport, setPendingReport] = useState<Report | null>(null);
  const [totalReports, setTotalReports] = useState(0);

  // Use scroll header with special behavior for report form
  const isHeaderVisible = useScrollHeader({ hideOnLoad: showForm });

  const handleReportSuccess = (reportData: any) => {
    // Generate email content with improved subject line format
    const subject = `Pothole Reported: ${reportData.area_name} - ${reportData.address}`;

    let body = `Dear BBMP Team,

I hope this message finds you well. I'm reaching out as a concerned citizen of Bangalore who cares deeply about the safety and well-being of our community.

I understand how challenging it must be to maintain our city's vast road network, and I truly appreciate the hard work your team does every day. However, I've encountered a pothole that has been causing significant concern for commuters in our area, and I believe it requires your urgent attention.

We all know how frustrating and dangerous potholes can be - they damage vehicles, cause accidents, and make our daily commutes stressful. This particular pothole has been affecting many residents and commuters, and I'm worried someone might get hurt if it's not addressed soon.

📍 Location Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Area: ${reportData.area_name}
• Address: ${reportData.address}
• GPS Coordinates: ${reportData.latitude}, ${reportData.longitude}
• Duration: ${reportData.duration.replace(/-/g, ' ')}
`;

    // Only include additional details if description exists
    if (reportData.description && reportData.description.trim()) {
      body += `
📝 Additional Observations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportData.description}
`;
    }

    body += `
📸 Photo Evidence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportData.image_url}

I've attached a photo so you can see the severity of the situation. This pothole is not just an inconvenience - it's a genuine safety hazard that puts our fellow citizens at risk every day.

I know your team is working tirelessly to keep Bangalore's roads safe, and I have faith that you'll prioritize this issue. Our community would be incredibly grateful for your prompt action in repairing this road damage.

Thank you so much for taking the time to read this and for all the work you do to keep our city moving safely. I'm confident that together, we can make Bangalore's roads better for everyone.

With sincere appreciation and hope,
A Concerned Citizen of Bangalore

P.S. If you need any additional information or would like me to provide more details, please don't hesitate to reach out. I'm happy to help in any way I can!`;

    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile, use mailto to open native Gmail app
      const mailtoLink = `mailto:comm@bbmp.gov.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } else {
      // On PC, open Gmail web interface
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=comm@bbmp.gov.in&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, '_blank');
    }
  };

  const { toast } = useToast();
  const recentReportsRef = useRef<RecentReportsHandles>(null);

  const handleFormSuccess = (reportData: Report) => {
    setPendingReport(reportData);
    setSubmissionStep('confirm');
    handleReportSuccess(reportData);
  };

  const handleConfirmSubmission = async () => {
    if (!pendingReport) return;

    try {
      setSubmissionStep('done');
      setTotalReports(prev => prev + 1);
      recentReportsRef.current?.refresh();

      toast({
        title: "Submission Confirmed!",
        description: "Your report has been logged and is now visible.",
      });

    } catch (error) {
      console.error("Error confirming submission:", error);
      toast({
        title: "Confirmation Failed",
        description: "There was an issue logging your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchTotalReports = async () => {
      try {
        const { count } = await supabase
          .from("pothole_reports")
          .select("*", { count: "exact", head: true });
        setTotalReports(count || 0);
      } catch (error) {
        console.error("Error fetching total reports count:", error);
      }
    };
    fetchTotalReports();
  }, []);

  const handleBackToHome = () => {
    setShowForm(false);
    setSubmissionStep('form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-zinc-900 dark:via-zinc-900 dark:to-black selection:bg-primary/20">
      {/* Floating Header with Scroll Behavior */}
      <header
        className={`fixed top-2 sm:top-4 left-0 right-0 z-50 px-2 sm:px-4 transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-24'
          }`}
      >
        <div className="container mx-auto p-0 sm:p-0">
          <div className="glass rounded-3xl sm:rounded-full border-x-0 border-t-0 sm:border px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleBackToHome}
                className="no-glass-effect flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                  <img src="/logo.jpg" alt="Pothole Hero" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-white/50" />
                </div>
                <h1 className="text-sm md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Pothole Hero
                </h1>
              </button>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {!showForm && (
                <>
                  <div className="glass px-3 py-1.5 md:px-4 rounded-full text-xs md:text-sm font-medium text-primary flex items-center gap-1.5 md:gap-2 hover:bg-white/80 transition-colors cursor-default">
                    <FileText className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="font-bold">{totalReports}</span>
                    <span className="hidden sm:inline">Reports Filed</span>
                  </div>
                </>
              )}
              {showForm && (
                <button
                  onClick={handleBackToHome}
                  className="text-xs md:text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-secondary/50"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 md:pt-28 pb-12 px-2 sm:px-4">
        {!showForm ? (
          <>
            <Hero onGetStarted={() => setShowForm(true)} />
            <RecentReports ref={recentReportsRef} />
          </>
        ) : (
          <section className="py-4 md:py-8">
            <div className="container mx-auto max-w-4xl">
              {submissionStep === 'form' && (
                <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-12 animate-in zoom-in-95 duration-500">
                  <ReportForm onSuccess={handleFormSuccess} />
                </div>
              )}

              {submissionStep === 'confirm' && (
                <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-12 text-center animate-in zoom-in-95 duration-500">
                  <div className="mb-6 inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Check Your Email Client</h2>
                  <div className="space-y-4 max-w-lg mx-auto">
                    <p className="text-muted-foreground text-base md:text-lg">
                      We've opened your default email client with a pre-filled report.
                      Please send the email to notify the authorities.
                    </p>
                    <div className="bg-secondary/50 p-4 rounded-xl">
                      <p className="font-semibold text-sm md:text-base">
                        After sending the email, click the button below to confirm and log your submission.
                      </p>
                    </div>
                    <Button onClick={handleConfirmSubmission} size="lg" className="mt-6 w-full sm:w-auto rounded-full h-12 px-8 text-lg shadow-lg hover:shadow-primary/25">
                      <CheckCircle className="mr-2 h-5 w-5" /> I Have Sent the Email
                    </Button>
                  </div>
                </div>
              )}

              {submissionStep === 'done' && (
                <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-12 text-center animate-in zoom-in-95 duration-500">
                  <div className="mb-6 inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-8 w-8 md:h-10 md:w-10" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Report Submitted Successfully!</h2>
                  <div className="space-y-4 max-w-lg mx-auto">
                    <p className="text-muted-foreground text-base md:text-lg">
                      Thank you for your contribution to making our roads safer. Your report is now live.
                    </p>
                    <Button onClick={handleBackToHome} size="lg" className="mt-6 rounded-full h-12 px-8 text-lg shadow-lg">
                      Report Another Pothole
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 bg-white/30 backdrop-blur-sm">
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