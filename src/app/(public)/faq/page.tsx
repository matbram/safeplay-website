import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export const metadata = {
  title: "FAQ - SafePlay",
  description: "Find answers to frequently asked questions about SafePlay's YouTube profanity filter.",
};

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
