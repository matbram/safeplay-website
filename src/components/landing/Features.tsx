"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Clock,
  Users,
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  Chrome,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Detection",
    description:
      "Advanced AI transcription with character-level precision identifies profanity in real-time with 99.5% accuracy.",
  },
  {
    icon: VolumeX,
    title: "Mute or Bleep",
    description:
      "Choose to silently mute profanity or replace it with a classic bleep sound. Your preference, your control.",
  },
  {
    icon: Clock,
    title: "Instant Caching",
    description:
      "Once a video is filtered, the transcript is cached. Subsequent views are instant with no processing wait.",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description:
      "Create profiles for each family member with shared credits. Parents can view children's watch history.",
  },
  {
    icon: Settings,
    title: "Custom Filters",
    description:
      "Add your own words to the filter list. Perfect for blocking specific phrases or terms you want to avoid.",
  },
  {
    icon: BarChart3,
    title: "Usage Tracking",
    description:
      "Monitor your credit usage with detailed analytics. See which videos you've filtered and when.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
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
              Everything You Need for{" "}
              <span className="gradient-text">Clean Viewing</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              SafePlay combines powerful AI technology with an intuitive interface to give you complete control over your YouTube experience.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative p-6 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Chrome Extension CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 relative rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 lg:p-12 overflow-hidden"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                <Chrome className="w-4 h-4" />
                Chrome Extension
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white">
                Install Our Free Chrome Extension
              </h3>
              <p className="mt-2 text-white/80 max-w-xl">
                Get the full SafePlay experience right in your browser. Filter any YouTube video with a single click.
              </p>
            </div>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-colors shadow-lg"
            >
              <Chrome className="w-6 h-6" />
              Add to Chrome - It&apos;s Free
            </a>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
