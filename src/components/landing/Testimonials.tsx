"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    content:
      "SafePlay has been a game-changer for our family. We can finally watch YouTube together without worrying about inappropriate language. The filtering is incredibly accurate!",
    author: "Sarah M.",
    role: "Mother of 3",
    rating: 5,
  },
  {
    content:
      "As a teacher, I use educational YouTube videos daily. SafePlay lets me confidently share content with my students knowing the language is appropriate.",
    author: "Michael T.",
    role: "High School Teacher",
    rating: 5,
  },
  {
    content:
      "I was skeptical at first, but the AI is remarkably precise. It catches profanity without disrupting the natural flow of the video. Worth every penny.",
    author: "David K.",
    role: "Content Creator",
    rating: 5,
  },
  {
    content:
      "Our church youth group uses SafePlay for movie nights. It's so easy to use, and parents appreciate knowing the content is filtered appropriately.",
    author: "Pastor James R.",
    role: "Youth Ministry Leader",
    rating: 5,
  },
  {
    content:
      "The family plan is perfect for us. Each kid has their own profile, and I can see what they've been watching. The parental controls give me peace of mind.",
    author: "Jennifer L.",
    role: "Parent",
    rating: 5,
  },
  {
    content:
      "We use SafePlay in our office break room. It's great for keeping the environment professional while still letting people enjoy content during lunch.",
    author: "Robert H.",
    role: "Office Manager",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-32">
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
              Loved by <span className="gradient-text">Families Everywhere</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of families, educators, and organizations who trust SafePlay for clean content.
            </p>
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="mt-4 text-foreground">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 rounded-2xl bg-muted/50"
        >
          {[
            { value: "10,000+", label: "Active Users" },
            { value: "500,000+", label: "Videos Filtered" },
            { value: "99.5%", label: "Detection Accuracy" },
            { value: "4.9/5", label: "Average Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold gradient-text">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
