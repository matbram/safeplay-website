import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { PreLaunchLanding } from "@/components/landing/PreLaunchLanding";
import { getLaunchMode } from "@/lib/launch-mode";

export default async function HomePage() {
  const launchMode = await getLaunchMode();

  // Show pre-launch landing page if in pre-launch mode
  if (launchMode.is_pre_launch) {
    return <PreLaunchLanding />;
  }

  // Show full landing page when launched
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
