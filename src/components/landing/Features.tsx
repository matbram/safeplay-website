"use client";

import {
  Shield,
  Zap,
  Clock,
  Users,
  Settings,
  BarChart3,
  Chrome,
  Sparkles,
  VolumeX,
  Volume2,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Precision Detection",
    description:
      "Advanced speech analysis with character-level precision identifies profanity in real-time with 99.5% accuracy.",
    color: "bg-amber-500",
  },
  {
    icon: VolumeX,
    title: "Mute or Bleep",
    description:
      "Choose to silently mute profanity or replace it with a classic bleep sound. Your preference, your control.",
    color: "bg-primary",
  },
  {
    icon: Clock,
    title: "Lightning Fast",
    description:
      "Videos you've already filtered play instantly. No waiting — just press play and enjoy clean content.",
    color: "bg-emerald-500",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description:
      "Create profiles for each family member with shared credits. Parents can view children's watch history.",
    color: "bg-blue-500",
  },
  {
    icon: Settings,
    title: "Custom Filters",
    description:
      "Add your own words to the filter list. Perfect for blocking specific phrases or terms you want to avoid.",
    color: "bg-purple-500",
  },
  {
    icon: BarChart3,
    title: "Usage Tracking",
    description:
      "Monitor your credit usage with detailed analytics. See which videos you've filtered and when.",
    color: "bg-pink-500",
  },
];

export function Features() {
  return (
    <section id="features" className="section bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="heading-1 text-foreground">
            Everything you need for{" "}
            <span className="gradient-text">clean viewing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            SafePlay combines powerful technology with an intuitive interface to give you complete control over your YouTube experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl" />
            </div>
          ))}
        </div>

        {/* Chrome Extension CTA */}
        <div className="mt-20 relative rounded-2xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-[#0F0F0F]" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
                  <Chrome className="w-4 h-4" />
                  Chrome Extension
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white">
                  Get the Chrome Extension
                </h3>
                <p className="mt-3 text-white/70 max-w-xl text-lg">
                  Filter any YouTube video directly in your browser. No extra steps — just press play and enjoy clean content.
                </p>

                {/* Mini features */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">One-click filtering</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">Syncs with your account</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">Lightweight & fast</span>
                  </div>
                </div>
              </div>

              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-white text-[#0F0F0F] font-semibold hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Chrome className="w-6 h-6" />
                <span>Add to Chrome — Free</span>
              </a>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}
