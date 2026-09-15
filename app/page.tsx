import Link from 'next/link';
import DAF from './daf/page';
export default function Index() {
    return (
        <main className="shell">
            <nav className="nav">
                <div className="brand"><span className="brand-mark">◌</span><span>echo<span className="brand-accent">delay</span></span></div>
                <Link className="nav-status" target="_blank" href="https://en.wikipedia.org/wiki/Delayed_auditory_feedback">What is DAF ?</Link>
            </nav>

            <section className="hero">
                <h1>DELAYED <em>AUDITORY</em> FEEDBACK.</h1>
                <p className="hero-copy">Hear yourself with a gentle delay. Build awareness, pacing, and confidence one phrase at a time.</p>
            </section>

            <DAF />

            <footer><span>Practice mindfully · Take breaks when you need them. </span></footer>
        </main>
    )
};