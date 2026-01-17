"use client";

import { Star, Quote, MessageCircle } from "lucide-react";

const testimonials = [
  {
    content:
      "SafePlay has been a game-changer for our family. We can finally watch YouTube together without worrying about inappropriate language. The filtering is incredibly accurate!",
    author: "Sarah M.",
    role: "Mother of 3",
    rating: 5,
    initial: "S",
    color: "bg-red-500",
  },
  {
    content:
      "As a teacher, I use educational YouTube videos daily. SafePlay lets me confidently share content with my students knowing the language is appropriate.",
    author: "Michael T.",
    role: "High School Teacher",
    rating: 5,
    initial: "M",
    color: "bg-blue-500",
  },
  {
    content:
      "I was skeptical at first, but the AI is remarkably precise. It catches profanity without disrupting the natural flow of the video. Worth every penny.",
    author: "David K.",
    role: "Content Creator",
    rating: 5,
    initial: "D",
    color: "bg-purple-500",
  },
  {
    content:
      "Our church youth group uses SafePlay for movie nights. It's so easy to use, and parents appreciate knowing the content is filtered appropriately.",
    author: "Pastor James R.",
    role: "Youth Ministry Leader",
    rating: 5,
    initial: "J",
    color: "bg-green-500",
  },
  {
    content:
      "The family plan is perfect for us. Each kid has their own profile, and I can see what they've been watching. The parental controls give me peace of mind.",
    author: "Jennifer L.",
    role: "Parent",
    rating: 5,
    initial: "J",
    color: "bg-amber-500",
  },
  {
    content:
      "We use SafePlay in our office break room. It's great for keeping the environment professional while still letting people enjoy content during lunch.",
    author: "Robert H.",
    role: "Office Manager",
    rating: 5,
    initial: "R",
    color: "bg-pink-500",
  },
];

export function Testimonials() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4" />
            Customer Stories
          </div>
          <h2 className="heading-1 text-foreground">
            Loved by <span className="gradient-text">Families Everywhere</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of families, educators, and organizations who trust SafePlay for clean content.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-8 h-8 text-primary" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-primary text-primary"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="mt-4 text-foreground leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center text-white font-semibold`}>
                  {testimonial.initial}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 relative overflow-hidden rounded-2xl">
          {/* Background */}
          <div className="absolute inset-0 bg-[#0F0F0F]" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />

          {/* Content */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 lg:p-12">
            {[
              { value: "10,000+", label: "Active Users" },
              { value: "1M+", label: "Videos Filtered" },
              { value: "99.5%", label: "Detection Accuracy" },
              { value: "4.9/5", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}
