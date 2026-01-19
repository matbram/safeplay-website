"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Shield, Check, Volume2, VolumeX, Star } from "lucide-react";

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

        {/* Video Player Mockup */}
        <div className="mt-16 lg:mt-20 max-w-5xl mx-auto animate-fade-in-up stagger-5">
          <div className="relative">
            {/* Glow effect behind player */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />

            {/* Browser Chrome */}
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/80 border border-border max-w-md w-full">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">youtube.com/watch?v=family-friendly-content</span>
                  </div>
                </div>
                <div className="w-16" /> {/* Spacer for balance */}
              </div>

              {/* YouTube-style Video Player */}
              <div className="relative aspect-video bg-[#0F0F0F]">
                {/* Video Thumbnail Area */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                  {/* Fake video content pattern */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute bottom-1/3 right-1/4 w-48 h-24 rounded-lg bg-white/5" />
                  </div>
                </div>

                {/* Center Play Button - YouTube Style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="play-button glow-red">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path d="M8 5v14l11-7z" fill="white"/>
                    </svg>
                  </div>
                </div>

                {/* SafePlay Active Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium shadow-lg">
                  <Shield className="w-4 h-4" />
                  <span>SafePlay Active</span>
                </div>

                {/* Filter notification popup */}
                <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <VolumeX className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profanity filtered</p>
                    <p className="text-xs text-white/60">Word muted at 3:24</p>
                  </div>
                </div>

                {/* YouTube-style Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="relative h-1 bg-white/30 rounded-full mb-3 group cursor-pointer hover:h-1.5 transition-all">
                    {/* Buffered */}
                    <div className="absolute left-0 top-0 h-full w-4/5 bg-white/40 rounded-full" />
                    {/* Progress */}
                    <div className="absolute left-0 top-0 h-full w-[65%] bg-primary rounded-full">
                      {/* Scrubber */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full scale-0 group-hover:scale-100 transition-transform" />
                    </div>
                    {/* Filtered sections markers */}
                    <div className="absolute left-[22%] top-0 h-full w-1 bg-white rounded-full" />
                    <div className="absolute left-[38%] top-0 h-full w-1 bg-white rounded-full" />
                    <div className="absolute left-[56%] top-0 h-full w-1 bg-white rounded-full" />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      {/* Play/Pause */}
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Play className="w-6 h-6" fill="white" />
                      </button>
                      {/* Volume */}
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Volume2 className="w-5 h-5" />
                      </button>
                      {/* Time */}
                      <span className="text-sm">8:24 / 12:47</span>
                    </div>

                    {/* Center - Filter info */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">3 words filtered</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Settings indicator */}
                      <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-medium">
                        MUTE MODE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
