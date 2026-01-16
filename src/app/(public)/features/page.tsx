import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";

export const metadata = {
  title: "Features - SafePlay",
  description: "Discover all the features that make SafePlay the best YouTube profanity filter. AI-powered detection, custom filters, family profiles, and more.",
};

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
