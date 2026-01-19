import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity } from "lucide-react";

export const metadata = {
  title: "System Status - SafePlay",
  description: "Check the current status of SafePlay services and infrastructure.",
};

const services = [
  { name: "Web Application", status: "operational", uptime: "99.99%" },
  { name: "Chrome Extension", status: "operational", uptime: "99.98%" },
  { name: "Video Processing", status: "operational", uptime: "99.95%" },
  { name: "User Authentication", status: "operational", uptime: "99.99%" },
  { name: "Payment Processing", status: "operational", uptime: "99.99%" },
  { name: "API Services", status: "operational", uptime: "99.97%" },
];

const incidents = [
  {
    date: "Jan 10, 2026",
    title: "Scheduled Maintenance Complete",
    status: "resolved",
    description: "Scheduled maintenance was completed successfully. All systems are operational.",
  },
  {
    date: "Jan 5, 2026",
    title: "Minor Processing Delays",
    status: "resolved",
    description: "Some users experienced brief delays in video processing. Issue has been resolved.",
  },
  {
    date: "Dec 28, 2025",
    title: "API Performance Optimization",
    status: "resolved",
    description: "Deployed performance improvements to API services. Response times improved by 40%.",
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case "operational":
      return <CheckCircle className="w-5 h-5 text-success" />;
    case "degraded":
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    case "outage":
      return <XCircle className="w-5 h-5 text-error" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded Performance";
    case "outage":
      return "Service Outage";
    default:
      return "Unknown";
  }
}

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">System Status</span>
              </div>

              <h1 className="heading-display text-foreground">
                Service <span className="gradient-text">Status</span>
              </h1>

              {/* Overall Status */}
              <div className={`mt-8 inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${
                allOperational ? "bg-success/10" : "bg-warning/10"
              }`}>
                {allOperational ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-warning" />
                )}
                <span className={`text-lg font-semibold ${
                  allOperational ? "text-success" : "text-warning"
                }`}>
                  {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
                </span>
              </div>

              <p className="mt-4 text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Services</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-medium text-foreground">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{service.uptime} uptime</span>
                    <span className={`text-sm font-medium ${
                      service.status === "operational" ? "text-success" : "text-warning"
                    }`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Uptime Graph Placeholder */}
        <section className="py-12 bg-background-secondary">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-6">90-Day Uptime</h2>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex gap-0.5">
                {[...Array(90)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-sm ${
                      Math.random() > 0.02 ? "bg-success" : "bg-warning"
                    }`}
                    title={`Day ${90 - i}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Recent Incidents</h2>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={index} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{incident.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{incident.date}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success capitalize">
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-3 text-muted-foreground">{incident.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
