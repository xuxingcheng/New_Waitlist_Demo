import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, Clock3, Layers3, Utensils } from "lucide-react";

const algorithmSteps = [
  {
    title: "Online confirmation",
    body: "Waiting guests are periodically moved into NEEDS_CONFIRMATION."
  },
  {
    title: "Delay instead of removal",
    body: "Missed confirmation moves a ticket back and records the delay event."
  },
  {
    title: "Virtual waiting groups",
    body: "Positions are compacted into groups of three after each queue change."
  },
  {
    title: "Dining-time learning",
    body: "Finished dining records update future wait-time estimates."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink">
        <Image
          src="/images/restaurant-queue-hero.png"
          alt="Modern restaurant host stand with a digital queue tablet"
          fill
          priority
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,32,51,0.9),rgba(23,32,51,0.55),rgba(23,32,51,0.2))]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-4 pb-16 pt-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-black uppercase tracking-normal text-emerald-200">
              Smart Restaurant Queue Demo
            </p>
            <h1 className="mt-4 max-w-xl text-5xl font-black tracking-normal sm:text-6xl">
              Smart Restaurant Queue Demo
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-100">
              A restaurant waitlist demo for online confirmation, virtual
              waiting-seat groups, final check-in, seating, and dining-time
              prediction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/customer" className="primary-button">
                Customer flow
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-100"
              >
                Staff dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/demo"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/35 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Simulation
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-12 grid max-w-7xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {algorithmSteps.map((step, index) => {
          const icons = [BellRing, Clock3, Layers3, Utensils];
          const Icon = icons[index];

          return (
            <article key={step.title} className="queue-card p-5">
              <Icon className="h-6 w-6 text-emerald-700" aria-hidden />
              <h2 className="mt-4 text-lg font-black text-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
