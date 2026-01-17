"use client";

import { Chrome, Link as LinkIcon, Sparkles, Play, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Chrome,
    title: "Install Extension",
    description:
      "Add our free Chrome extension with one click. No sign up required to try it out.",
    color: "bg-blue-500",
  },
  {
    number: "2",
    icon: LinkIcon,
    title: "Open Any Video",
    description:
      "Browse YouTube as usual. Click the SafePlay icon when you find a video to filter.",
    color: "bg-purple-500",
  },
  {
    number: "3",
    icon: Sparkles,
    title: "Smart Processing",
    description:
      "Our system analyzes the audio in seconds, identifying profanity with 99.5% accuracy.",
    color: "bg-amber-500",
  },
  {
    number: "4",
    icon: Play,
    title: "Watch Clean",
    description:
      "Enjoy your video with all profanity automatically muted or bleeped out.",
    color: "bg-primary",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="heading-1 text-foreground">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start watching clean content in under a minute. No complicated setup required.
          </p>
        </div>

        {/* Steps - Horizontal layout */}
        <div className="mt-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full">
                  {/* Step number */}
                  <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {step.number}
                  </div>

                  {/* Content */}
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Icon in corner */}
                  <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <step.icon className="w-16 h-16 text-foreground" />
                  </div>
                </div>

                {/* Arrow connector (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demo Video Section */}
        <div id="demo" className="mt-20">
          <div className="relative max-w-4xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl blur-2xl" />

            {/* Video Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-[#0F0F0F] shadow-2xl">
              {/* Fake video thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                {/* Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
                  <div className="absolute bottom-1/3 right-1/4 w-64 h-32 rounded-full bg-primary/10 blur-3xl" />
                </div>
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Play Button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <button className="group flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform glow-red">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </div>
                </button>
                <p className="mt-4 text-white font-medium text-lg">See SafePlay in Action</p>
                <p className="mt-1 text-white/60 text-sm">2 minute demo</p>
              </div>

              {/* Video title bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SP</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">SafePlay Demo - How to Filter YouTube Videos</p>
                    <p className="text-white/60 text-sm">SafePlay Official • 50K views</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
