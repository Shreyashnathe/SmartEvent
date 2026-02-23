import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Personalized Recommendations',
    description: 'Discover events based on your coding and communication preferences.',
  },
  {
    title: 'Live + Trending Discovery',
    description: 'Stay up to date with curated live picks and what is trending now.',
  },
  {
    title: 'Preference Control',
    description: 'Fine-tune your recommendation weights anytime from your profile.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-100 bg-white px-6 py-12 shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">SmartEvent</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Find the right events with personalized recommendations.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            SmartEvent helps you discover relevant online and offline events by combining your interests with
            real-time trends.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-indigo-700 hover:shadow-md"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50"
            >
              Register
            </Link>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
