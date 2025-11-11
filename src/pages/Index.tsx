import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import ReportForm from "@/components/ReportForm";
import RecentReports from "@/components/RecentReports";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    fetchTotalReports();
  }, []);

  const fetchTotalReports = async () => {
    try {
      const { count, error } = await supabase
        .from('pothole_reports')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalReports(count || 0);
    } catch (error) {
      console.error('Error fetching total reports:', error);
    }
  };

  const handleReportSuccess = async (reportData: any) => {
    // Extract road name from address (usually the first part before comma)
    const roadName = reportData.address.split(',')[0].trim();
    
    // Generate emotional, human-like email content
    const subject = `Urgent: Dangerous Pothole on ${roadName}, ${reportData.area_name} - Immediate Attention Required`;
    
    let body = `Dear BBMP Officials,

I hope this message finds you well. I am writing to you today with genuine concern for the safety of our community.

I recently came across a pothole that has been causing significant trouble for commuters in ${reportData.area_name}. This isn't just another pothole - it has been there for ${reportData.duration.replace(/-/g, ' ')}, and I'm genuinely worried about the risks it poses to everyone who uses this road daily.

📍 Location Details:
• Road: ${roadName}
• Area: ${reportData.area_name}
• Full Address: ${reportData.address}
• Exact Location: ${reportData.latitude}, ${reportData.longitude}

🕒 Duration: This pothole has existed for ${reportData.duration.replace(/-/g, ' ')}`;

    // Only include additional details if description exists
    if (reportData.description && reportData.description.trim()) {
      body += `

💬 Additional Concerns:
${reportData.description}`;
    }

    body += `

📸 I've attached photographic evidence: ${reportData.image_url}

I understand that maintaining Bangalore's vast road network is an enormous task, and I truly appreciate all the hard work your team does. However, this particular pothole has been causing distress to many commuters, and I fear someone might get hurt if it's not addressed soon.

Two-wheelers are especially vulnerable to such road damage, and during the rainy season, these potholes become even more dangerous as they fill with water and become difficult to spot. I've seen people swerve suddenly to avoid it, which creates additional safety hazards.

I kindly request you to please look into this matter at the earliest possible convenience. I believe that with your prompt attention, we can make our roads safer for everyone who travels through ${reportData.area_name}.

Thank you so much for taking the time to read this. I have faith in BBMP's commitment to keeping Bangalore's roads safe, and I'm grateful for your service to our city.

Looking forward to your positive response.

With warm regards and hope,
A Concerned Citizen of Bangalore`;

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

    // Refresh total reports count
    fetchTotalReports();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                PH
              </div>
              <h1 className="text-xl font-bold">Pothole Hero</h1>
            </button>
            {showForm && (
            <div className="flex items-center gap-4">
              {!showForm && (
                <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
                  {totalReports} Reports Submitted
                </Badge>
              )}
              {showForm && (
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Home
                </button>
              )}
            </div>
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