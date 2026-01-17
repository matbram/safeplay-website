import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Chrome, Shield, Zap, Download, Check, Star, Play, Monitor } from "lucide-react";

export const metadata = {
  title: "Chrome Extension - SafePlay",
  description: "Download the SafePlay Chrome extension to filter profanity from YouTube videos directly in your browser.",
};

const features = [
  {
    icon: Zap,
    title: "One-Click Filtering",
    description: "Just click the SafePlay icon on any YouTube video to start filtering instantly.",
  },
  {
    icon: Shield,
    title: "Real-Time Protection",
    description: "Profanity is detected and filtered as the video plays, with no buffering or delays.",
  },
  {
    icon: Monitor,
    title: "Seamless Integration",
    description: "Works naturally within YouTube. No separate apps or complicated setup required.",
  },
];

const steps = [
  {
    number: "1",
    title: "Install from Chrome Web Store",
    description: "Click the button above to add SafePlay to Chrome. It takes just seconds.",
  },
  {
    number: "2",
    title: "Sign in to Your Account",
    description: "Connect your SafePlay account to sync your preferences and credits.",
  },
  {
    number: "3",
    title: "Browse YouTube",
    description: "Navigate to any YouTube video you want to watch.",
  },
  {
    number: "4",
    title: "Click to Filter",
    description: "Press the SafePlay button and enjoy clean content instantly.",
  },
];

export default function ExtensionPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Chrome className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Chrome Extension</span>
                </div>

                <h1 className="heading-display text-foreground">
                  Filter YouTube
                  <br />
                  <span className="gradient-text">Right in Your Browser</span>
                </h1>

                <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                  The SafePlay Chrome extension brings powerful profanity filtering directly to YouTube.
                  No extra apps, no complicated setup — just clean viewing with one click.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="xl" className="text-base" asChild>
                    <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer">
                      <Chrome className="w-5 h-5 mr-2" />
                      Add to Chrome — Free
                    </a>
                  </Button>
                  <Button size="xl" variant="outline" className="text-base" asChild>
                    <Link href="#how-it-works">
                      <Play className="w-5 h-5 mr-2" />
                      See How It Works
                    </Link>
                  </Button>
                </div>

                <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">4.9 rating on Chrome Web Store</span>
                </div>
              </div>

              {/* Extension Preview */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />
                  <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                          <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">SafePlay</h3>
                          <p className="text-sm text-muted-foreground">YouTube Profanity Filter</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                        <span className="text-success font-medium">Extension Active</span>
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Filter Mode</span>
                        <span className="font-medium">Mute</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Credits Available</span>
                        <span className="font-medium text-primary">705</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Why Use the <span className="gradient-text">Extension?</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Get Started in <span className="gradient-text">4 Simple Steps</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="relative p-6 rounded-2xl bg-card border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button size="xl" asChild>
                <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5 mr-2" />
                  Download Now — It&apos;s Free
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
