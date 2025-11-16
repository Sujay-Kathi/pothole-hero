import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import ReportForm from "@/components/ReportForm";
import RecentReports, { RecentReportsHandles } from "@/components/RecentReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Report } from "@/types/report";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { Link } from "react-router-dom";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [pendingReport, setPendingReport] = useState<Report | null>(null);
  const [totalReports, setTotalReports] = useState(0);

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
      // The report is already in the database from the form component.
      // This step now confirms it's "live".
      // If the form didn't insert, you would insert it here.
      // For now, we just update the UI.

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.jpg" alt="Pothole Hero" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Pothole Hero</h1>
            </button>
            <div className="flex items-center gap-4">
              {!showForm && (
                <>
                  <div className="rounded-full border border-transparent bg-orange-100 text-orange-800 font-semibold transition-colors hover:bg-orange-200/80 hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">{totalReports}</span>
                    <span className="hidden sm:inline">Total Reports</span>
                  </div>
                  <Link to="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                </>
              )}
              {showForm && (
                <button
                  onClick={handleBackToHome}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Home
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!showForm ? (
          <>
            <Hero onGetStarted={() => setShowForm(true)} />
            <RecentReports ref={recentReportsRef} />
          </>
        ) : (
          <section className="py-16">
            <div className="container mx-auto px-4">
              {submissionStep === 'form' && (
                <Card className="p-8 shadow-[var(--shadow-elevated)]">
                  <ReportForm onSuccess={handleFormSuccess} />
                </Card>
              )}

              {submissionStep === 'confirm' && (
                <Card className="p-8 shadow-[var(--shadow-elevated)] text-center">
                  <CardHeader>
                    <Mail className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="mt-4 text-2xl">Check Your Email Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      We've opened your default email client with a pre-filled report.
                      Please send the email to notify the authorities.
                    </p>
                    <p className="font-semibold">
                      After sending the email, click the button below to confirm and log your submission.
                    </p>
                    <Button onClick={handleConfirmSubmission} size="lg" className="mt-4">
                      <CheckCircle className="mr-2 h-5 w-5" /> I Have Sent the Email
                    </Button>
                  </CardContent>
                </Card>
              )}

              {submissionStep === 'done' && (
                 <Card className="p-8 shadow-[var(--shadow-elevated)] text-center">
                  <CardHeader>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="mt-4 text-2xl">Report Submitted Successfully!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Thank you for your contribution to making our roads safer. Your report is now live.
                    </p>
                    <Button onClick={handleBackToHome} size="lg" className="mt-4">
                      Report Another Pothole
                    </Button>
                  </CardContent>
                </Card>
              )}
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