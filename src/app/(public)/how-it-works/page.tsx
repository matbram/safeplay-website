import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";

export const metadata = {
  title: "How It Works - SafePlay",
  description: "Learn how SafePlay filters profanity from YouTube videos in real-time. Simple setup, powerful results.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
