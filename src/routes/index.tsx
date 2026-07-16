import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, CalendarClock, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Your productivity toolkit: write emails, plan your day, and chat with an AI assistant.",
      },
    ],
  }),
  component: Dashboard,
});

const features = [
  {
    to: "/email" as const,
    icon: Mail,
    title: "Smart Email Generator",
    description: "Draft polished, on-tone emails in seconds. Edit, copy, or regenerate freely.",
    cta: "Write an email",
  },
  {
    to: "/planner" as const,
    icon: CalendarClock,
    title: "AI Task Planner",
    description: "Turn a task list into a realistic daily or weekly schedule with breaks and priorities.",
    cta: "Plan my schedule",
  },
  {
    to: "/chat" as const,
    icon: MessageSquare,
    title: "Workplace Chat Assistant",
    description: "A quick sounding board for writing, planning, brainstorming, and meeting prep.",
    cta: "Start chatting",
  },
];

function Dashboard() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-soft sm:p-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
          <Sparkles className="h-3.5 w-3.5" /> Session-only · No signup
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Your AI productivity co-pilot for the workday.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
          Draft emails, plan your time, and think out loud with an assistant tuned for workplace tasks.
          Nothing is stored — open it, use it, close it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/chat">Open assistant</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/email">Generate an email</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card
            key={f.to}
            className="group flex flex-col justify-between rounded-2xl border-border/70 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            <CardHeader>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3 font-display">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="px-0 text-primary hover:bg-transparent hover:text-accent">
                <Link to={f.to} className="inline-flex items-center gap-1">
                  {f.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:grid-cols-3">
        {[
          { title: "No account", body: "Open the app and start immediately — no login, no profile." },
          { title: "No storage", body: "Everything lives in this session. Refresh clears it." },
          { title: "Always editable", body: "Copy, tweak, or regenerate every AI output before you use it." },
        ].map((item) => (
          <div key={item.title}>
            <p className="font-display text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>

      <AiDisclaimer />
    </div>
  );
}
