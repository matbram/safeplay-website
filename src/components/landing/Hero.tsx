"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Shield, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 hero-gradient overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
              AI-Powered Profanity Filtering
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Watch YouTube{" "}
              <span className="gradient-text">Without the Profanity</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              SafePlay automatically mutes or bleeps profanity in YouTube videos using advanced AI transcription. Perfect for families, educators, and workplaces.
            </p>

            {/* Key Benefits */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-5 h-5 text-success" />
                <span>No downloads required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-5 h-5 text-success" />
                <span>Works instantly</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-5 h-5 text-success" />
                <span>Character-level precision</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" asChild>
                <Link href="/signup">
                  Start Filtering Free
                  <Shield className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#demo">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background"
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">10,000+</span> families trust SafePlay
              </div>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Browser Mockup */}
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-primary" />
                      youtube.com/watch?v=...
                    </div>
                  </div>
                </div>

                {/* Video Player Mockup */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800">
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>

                  {/* SafePlay Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-medium shadow-lg">
                    <Shield className="w-4 h-4" />
                    SafePlay Active
                  </div>

                  {/* Progress bar with muted sections */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full w-2/3 bg-white/80 rounded-full relative">
                        {/* Muted sections indicators */}
                        <div className="absolute left-[20%] w-[5%] h-full bg-primary" />
                        <div className="absolute left-[45%] w-[3%] h-full bg-primary" />
                        <div className="absolute left-[60%] w-[4%] h-full bg-primary" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-white/80 text-xs">
                      <span>12:34</span>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">3 words filtered</span>
                      </div>
                      <span>18:45</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -left-8 top-1/4 hidden lg:block"
              >
                <div className="px-4 py-3 rounded-xl bg-card border shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                      <Check className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profanity Muted</p>
                      <p className="text-xs text-muted-foreground">at 5:23</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -right-4 bottom-1/4 hidden lg:block"
              >
                <div className="px-4 py-3 rounded-xl bg-card border shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI Transcription</p>
                      <p className="text-xs text-muted-foreground">99.5% accurate</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
    </section>
  );
}
