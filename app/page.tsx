import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-12">
      <section className="w-full rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-100/50 sm:p-12">
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

        <Link
          href="/questions"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Start Practicing
        </Link>
      </section>
    </main>
  );
}
