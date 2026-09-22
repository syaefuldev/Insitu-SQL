'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Database, ShieldCheck, Cpu } from 'lucide-react';

const Workbench = dynamic(
  () => import('@/components/workbench/Workbench').then((mod) => mod.Workbench),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-carbon-900 text-zinc-300 font-sans select-none">
        <div className="relative flex flex-col items-center max-w-sm w-full p-8 rounded-xl border border-workbench-border bg-carbon-850 shadow-2xl">
          <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-400 shadow-inner">
            <Database className="h-7 w-7 animate-pulse text-indigo-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
            </span>
          </div>

          <div className="text-center">
            <h1 className="font-mono text-base font-bold tracking-wider text-zinc-100 uppercase">
              InSitu SQL
            </h1>
            <p className="mt-1 font-mono text-2xs text-zinc-400">
              Initializing local analytics engine...
            </p>
          </div>

          <div className="mt-6 w-full overflow-hidden rounded-full bg-carbon-950 p-0.5 border border-workbench-border">
            <div className="h-1 rounded-full bg-gradient-to-r from-indigo-500/40 via-indigo-500 to-cyan-400 animate-pulse w-full" />
          </div>

          <div className="mt-6 flex items-center space-x-2 rounded-md border border-workbench-border bg-carbon-900 px-3 py-1.5 text-2xs text-zinc-400 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>100% Client-Side • Zero Server / Telemetry</span>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-2xs text-zinc-500 font-mono">
          <Cpu className="h-3 w-3 text-zinc-500" />
          <span>InSitu SQL Tabular Analytics Runtime</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-carbon-900 overflow-hidden">
      <Workbench />
    </main>
  );
}
