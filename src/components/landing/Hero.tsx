"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Shield, Check, Star } from "lucide-react";
import { DemoVideoSelector } from "./DemoVideoSelector";

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Animated background shapes */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in-down">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">Trusted by 10,000+ families</span>
          </div>

          {/* Headline */}
          <h1 className="heading-display text-foreground animate-fade-in-up">
            Watch YouTube
            <br />
            <span className="gradient-text">Without the Profanity</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
            SafePlay automatically mutes or bleeps profanity in any YouTube video with incredible precision.
            Perfect for families, classrooms, and workplaces.
          </p>

          {/* Key Benefits */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Chrome Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Instant Filtering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">99.5% Accuracy</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-4">
            <Button size="xl" className="text-base px-8" asChild>
              <Link href="/signup">
                Get Started Free
                <Shield className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="text-base px-8 group" asChild>
              <Link href="#demo">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 group-hover:bg-primary/20 transition-colors">
                  <Play className="w-4 h-4 text-primary ml-0.5" />
                </div>
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Credit info */}
          <p className="mt-6 text-sm text-muted-foreground animate-fade-in-up stagger-5">
            Start with <span className="font-semibold text-foreground">30 free credits</span> — no credit card required
          </p>
        </div>

        {/* Interactive Demo Player */}
        <div id="demo" className="mt-16 lg:mt-20 max-w-5xl mx-auto animate-fade-in-up stagger-5">
          <DemoVideoSelector />
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-up stagger-6">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground mt-1">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">1M+</div>
            <div className="text-sm text-muted-foreground mt-1">Videos Filtered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">99.5%</div>
            <div className="text-sm text-muted-foreground mt-1">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary">Free</div>
            <div className="text-sm text-muted-foreground mt-1">To Get Started</div>
          </div>
        </div>
      </div>
    </section>
  );
}
