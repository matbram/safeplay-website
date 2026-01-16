"use client";

import { motion } from "framer-motion";
import { Chrome, Link as LinkIcon, Sparkles, Play } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Chrome,
    title: "Install the Extension",
    description:
      "Add our free Chrome extension to your browser. It takes just one click and works immediately.",
  },
  {
    number: "02",
    icon: LinkIcon,
    title: "Find a Video",
    description:
      "Browse YouTube normally. When you find a video you want to watch, click the SafePlay button.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "AI Processes Audio",
    description:
      "Our AI transcribes the audio with character-level precision, identifying all profanity in seconds.",
  },
  {
    number: "04",
    icon: Play,
    title: "Watch Clean Content",
    description:
      "Enjoy your video with profanity automatically muted or bleeped. It's that simple.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              How SafePlay <span className="gradient-text">Works</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Clean YouTube viewing in four simple steps. No complicated setup, no technical knowledge required.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative z-10 p-6 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-6 px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="mt-4 w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-3 z-20">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo Video Section */}
        <motion.div
          id="demo"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20"
        >
          <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden border shadow-2xl bg-slate-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="group flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-lg">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                Watch How It Works
              </button>
            </div>
            {/* Placeholder overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
