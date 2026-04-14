import Link from "next/link";
import Image from "next/image";
import { SurfaceCard } from "@/components/SurfaceCard";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-12">
      <SurfaceCard tone="brand" className="w-full p-8 text-center sm:p-12 paws-enter">
        <Image
          src="/paws4mcat-logo-transparent.png"
          alt="Paws4MCAT logo"
          width={900}
          height={560}
          priority
          className="mx-auto mb-4 h-auto w-full max-w-md"
        />

        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Paws4MCAT
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          MCAT Success Across Languages
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/questions"
            className={[
              "inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white",
              "transition duration-200 ease-out motion-reduce:transition-none",
              "hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent",
            ].join(" ")}
          >
            Start Practicing
          </Link>
          <Link
            href="/dashboard"
            className={[
              "inline-flex rounded-full border border-slate-300 bg-white/80 px-7 py-3 font-semibold text-slate-700",
              "transition duration-200 ease-out motion-reduce:transition-none",
              "hover:bg-white hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent",
            ].join(" ")}
          >
            View Dashboard
          </Link>
        </div>
      </SurfaceCard>
    </main>
  );
}
