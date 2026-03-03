import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import './Landing.css';

const FEATURES = [
    { icon: '🎨', title: 'Multiple Diagram Types', desc: 'UML Class, Sequence, Activity, Use Case, ER diagrams, DFD, and more.' },
    { icon: '⚡', title: 'Live Preview', desc: 'See your diagrams render in real-time as you type your code.' },
    { icon: '🔧', title: 'Powerful Editor', desc: 'Full-featured code editor with syntax highlighting and auto-complete.' },
    { icon: '📤', title: 'Export Anywhere', desc: 'Download as SVG or PNG. Share via link for read-only collaboration.' },
    { icon: '☁️', title: 'Cloud Storage', desc: 'Your diagrams are saved automatically and accessible from any device.' },
    { icon: '🌙', title: 'Dark Mode', desc: 'Beautiful light and dark themes. Easy on the eyes, day or night.' },
];

const EXAMPLES = [
    { type: 'Class Diagram', syntax: 'PlantUML', color: '#6366f1' },
    { type: 'Sequence Diagram', syntax: 'SeqDiag', color: '#06b6d4' },
    { type: 'Activity Diagram', syntax: 'ActDiag', color: '#8b5cf6' },
    { type: 'ER Diagram', syntax: 'ERD', color: '#ec4899' },
    { type: 'Flowchart', syntax: 'Graphviz', color: '#f59e0b' },
    { type: 'Network Diagram', syntax: 'NwDiag', color: '#10b981' },
];

const STEPS = [
    { num: '01', title: 'Sign Up', desc: 'Create your free account with Google or email in seconds.' },
    { num: '02', title: 'Write Code', desc: 'Pick a diagram type and start writing in DOT, PlantUML, Mermaid, and more.' },
    { num: '03', title: 'See Results', desc: 'Your diagram renders instantly. Iterate and refine in real-time.' },
    { num: '04', title: 'Export & Share', desc: 'Download your diagram or share a read-only link with your team.' },
];

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Hero */}
            <section className="hero">
                <div className="hero__bg">
                    <div className="hero__orb hero__orb--1" />
                    <div className="hero__orb hero__orb--2" />
                    <div className="hero__orb hero__orb--3" />
                </div>
                <div className="container hero__content">
                    <div className="badge animate-fade-in-up" style={{ animationDelay: '0.1s' }}>✨ Diagrams from Code</div>
                    <h1 className="hero__title animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Design. Visualize.<br />
                        <span className="hero__title-accent">Ship Faster.</span>
                    </h1>
                    <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Transform your textual descriptions into stunning UML, ER, and Data Flow diagrams.
                        — no drag-and-drop needed.
                    </p>
                    <div className="hero__actions animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <Link to={user ? '/my-diagrams' : '/auth'} className="btn btn-primary btn-lg">
                            Try it!
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section features" id="features">
                <div className="container">
                    <div className="section__header">
                        <span className="badge">Features</span>
                        <h2>Everything you need to create diagrams</h2>
                        <p className="section__desc">A complete toolkit for turning ideas into professional diagrams.</p>
                    </div>
                    <div className="features__grid">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="feature-card glass" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-card__icon">{f.icon}</div>
                                <h4 className="feature-card__title">{f.title}</h4>
                                <p className="feature-card__desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Examples */}
            <section className="section examples" id="examples">
                <div className="container">
                    <div className="section__header">
                        <span className="badge">Examples</span>
                        <h2>Diagrams you can create</h2>
                        <p className="section__desc">Support for all major diagram types and syntaxes.</p>
                    </div>
                    <div className="examples__grid">
                        {EXAMPLES.map((ex, i) => (
                            <div key={i} className="example-card glass" style={{ '--card-accent': ex.color }}>
                                <div className="example-card__preview">
                                    <div className="example-card__placeholder">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ex.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="example-card__info">
                                    <span className="example-card__type">{ex.type}</span>
                                    <span className="example-card__syntax">{ex.syntax}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Getting Started */}
            <section className="section getting-started" id="getting-started">
                <div className="container">
                    <div className="section__header">
                        <span className="badge">Getting Started</span>
                        <h2>Up and running in minutes</h2>
                        <p className="section__desc">Four simple steps to your first diagram.</p>
                    </div>
                    <div className="steps">
                        {STEPS.map((step, i) => (
                            <div key={i} className="step">
                                <div className="step__number">{step.num}</div>
                                <div className="step__content">
                                    <h4>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                                {i < STEPS.length - 1 && <div className="step__connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
