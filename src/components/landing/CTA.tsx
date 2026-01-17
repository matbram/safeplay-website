"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Check, Play } from "lucide-react";

export function CTA() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background - YouTube Dark with gradient */}
          <div className="absolute inset-0 bg-[#0F0F0F]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-16">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left side - Text */}
              <div className="flex-1 text-center lg:text-left">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg glow-red">
                  <Shield className="w-8 h-8 text-white" />
                </div>

                {/* Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  Start Watching
                  <br />
                  <span className="text-primary">Clean Content Today</span>
                </h2>

                {/* Subheadline */}
                <p className="mt-4 text-lg text-white/70 max-w-lg">
                  Join over 10,000 families who trust SafePlay. Get started free with 30 credits - no credit card required.
                </p>

                {/* Trust indicators */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start">
                  {[
                    "No credit card required",
                    "30 free credits/month",
                    "Cancel anytime",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-white/80">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="xl"
                    className="bg-primary hover:bg-primary-hover text-white shadow-lg"
                    asChild
                  >
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    asChild
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>

              {/* Right side - Visual element */}
              <div className="flex-shrink-0 hidden lg:block">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />

                  {/* Video preview card */}
                  <div className="relative w-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    {/* Video thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative">
                      {/* SafePlay badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary text-white text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        Protected
                      </div>

                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-white ml-1" fill="white" />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="w-2/3 h-full bg-primary" />
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="p-3 bg-[#181818]">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                          SP
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            Family Movie Night
                          </p>
                          <p className="text-white/50 text-xs">
                            5 words filtered • 2:15:30
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter notification */}
                  <div className="absolute -bottom-4 -left-8 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181818] border border-white/10 shadow-xl animate-bounce-slow">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-white text-sm font-medium">Word filtered at 1:23:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="cta-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
