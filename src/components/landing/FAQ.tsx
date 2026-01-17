"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does SafePlay filter profanity?",
    answer:
      "SafePlay uses advanced AI-powered speech recognition to transcribe YouTube videos with character-level precision. Our system identifies profanity and automatically mutes or bleeps those specific moments while the video plays. The filtering happens in real-time with minimal latency.",
  },
  {
    question: "What counts as a 'credit'?",
    answer:
      "One credit equals one minute of video filtering. For example, a 45-minute video costs 45 credits. If you've already filtered a video before, watching it again is free since we cache the transcript.",
  },
  {
    question: "Does SafePlay work on all YouTube videos?",
    answer:
      "SafePlay works on most YouTube videos. However, some videos with age restrictions or certain copyright protections may not be accessible. Live streams are also not currently supported.",
  },
  {
    question: "Can I customize what gets filtered?",
    answer:
      "Yes! Paid plans include custom word filters where you can add specific words or phrases you want to filter, in addition to our standard profanity list. You can also adjust the sensitivity level to catch more or less content.",
  },
  {
    question: "How do family profiles work?",
    answer:
      "Family profiles let you create separate accounts for each family member under one subscription. Each profile has its own viewing history and preferences, but they share the monthly credit pool. Parents can view children's watch history with parental controls.",
  },
  {
    question: "What happens if I run out of credits?",
    answer:
      "If you run out of credits, you can either wait until your next billing cycle when credits reset, or upgrade to a higher plan for more credits immediately. We'll notify you when you're running low so you can plan ahead.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Our Free plan gives you 30 credits per month forever, so you can try SafePlay before committing to a paid plan. Paid plans also include a 7-day free trial with full access to all features.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period, and you won't be charged again.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="section bg-background-secondary">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h2 className="heading-1 text-foreground">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about SafePlay.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-12">
          <Accordion.Root type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 data-[state=open]:border-primary/50 data-[state=open]:shadow-lg"
              >
                <Accordion.Trigger className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-foreground hover:text-primary transition-colors group">
                  <span className="pr-4">{faq.question}</span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary" />
                  </div>
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-muted/50 border border-border">
          <p className="text-foreground font-medium">Still have questions?</p>
          <p className="mt-1 text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? Please{" "}
            <a href="/contact" className="text-primary hover:underline font-medium">
              contact our support team
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
