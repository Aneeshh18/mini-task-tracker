import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container center">
      <span className="heroDecor">✨</span>
      <h1 className="heroTitle">Mini Task Tracker</h1>
      <p className="heroSubtitle">
        Stay organized and productive. Track your tasks with a clean, modern
        interface.
      </p>
      <Link className="button heroButton" href="/auth">
        Get Started →
      </Link>
    </main>
  );
}
