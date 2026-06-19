'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const stagger = { container: { hidden:{}, show:{ transition:{ staggerChildren:0.1 } } }, item: { hidden:{ opacity:0,y:24 }, show:{ opacity:1,y:0,transition:{ duration:0.6,ease:[0.4,0,0.2,1] } } } };

const FEATURES = [
  { icon:'🤖', title:'AI Timetable Parser', desc:'Upload a photo of your schedule. Claude AI extracts every subject, day, and time slot instantly — even from messy handwritten tables.', color:'from-violet-500/20 to-purple-800/10' },
  { icon:'📅', title:'Auto Schedule Generation', desc:'Your entire semester schedule is created automatically. Thousands of sessions generated in seconds from your timetable photo.', color:'from-cyan-500/20 to-teal-800/10' },
  { icon:'✅', title:'One-Tap Attendance', desc:'Mark Present, Absent, or Holiday with a single tap. Instant sync across devices with real-time percentage updates.', color:'from-emerald-500/20 to-green-800/10' },
  { icon:'📊', title:'Smart Analytics', desc:'Subject-wise breakdown, 75% threshold alerts, and trend analysis. Know exactly how many classes you can afford to miss.', color:'from-pink-500/20 to-rose-800/10' },
  { icon:'📝', title:'Session Notes', desc:'Attach notes to any class session. Never lose a lecture summary again — everything is tied to the exact class it belongs to.', color:'from-amber-500/20 to-orange-800/10' },
  { icon:'📆', title:'Weekly Calendar', desc:'Beautiful week-view calendar with color-coded attendance status. Visualise your entire academic week at a glance.', color:'from-blue-500/20 to-indigo-800/10' },
];

const STATS = [
  { value:'10k+', label:'Students Tracking' },
  { value:'99.2%', label:'Parse Accuracy' },
  { value:'< 3s', label:'AI Parse Time' },
  { value:'75%', label:'Threshold Alerts' },
];

function FloatingOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl opacity-30 animate-blob pointer-events-none ${className}`} />;
}

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => { if (session) router.push('/dashboard'); }, [session, router]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Orbs ─────────────────────────────────────────────────────────── */}
      <FloatingOrb className="w-[700px] h-[700px] bg-violet-600 top-[-200px] left-[-200px]" />
      <FloatingOrb className="w-[500px] h-[500px] bg-cyan-500 top-[10%] right-[-150px] [animation-delay:2s]" />
      <FloatingOrb className="w-[400px] h-[400px] bg-pink-600 bottom-[20%] left-[10%] [animation-delay:4s]" />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3">
          <span className="font-playfair text-xl font-bold gradient-text-static">Scholr</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">Sign in</Link>
            <Link href="/auth/register" className="text-sm font-medium px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all btn-glow">
              Get started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16"
      >
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.8, ease:[0.4,0,0.2,1] }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-white/60"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-powered attendance tracking for college students
          </motion.div>

          <h1 className="font-playfair text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <span className="gradient-text">Never miss</span>
            <br />
            <span className="text-white/90">the 75% line</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your timetable photo. Claude AI parses your schedule in seconds.
            Track attendance, get alerts, and analyze your academic performance — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 font-semibold text-white transition-all btn-glow hover:scale-105 hover:from-violet-500 hover:to-cyan-500"
            >
              <span className="relative z-10">Start tracking free →</span>
            </Link>
            <Link href="/auth/login"
              className="px-8 py-4 rounded-2xl glass font-medium text-white/80 hover:text-white hover:border-white/20 transition-all hover:scale-105"
            >
              Sign in to dashboard
            </Link>
          </div>
        </motion.div>

        {/* ── Floating dashboard preview ────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:60, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
          transition={{ delay:0.5, duration:1, ease:[0.4,0,0.2,1] }}
          className="relative mt-20 w-full max-w-3xl mx-auto animate-float"
        >
          <div className="glass-card rounded-3xl p-6 glow-purple">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1.5">
                {['bg-red-400','bg-yellow-400','bg-green-400'].map(c => (
                  <div key={c} className={`w-3 h-3 rounded-full ${c} opacity-70`} />
                ))}
              </div>
              <div className="flex-1 glass rounded-lg px-3 py-1.5 text-xs text-white/30 font-mono">scholr.app/dashboard</div>
            </div>
            {/* Mock Dashboard */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[['84%','Attendance'],['32','Present'],['6','Absent'],['2','Holidays']].map(([v,l],i) => (
                <div key={i} className="glass rounded-xl p-3 text-center">
                  <div className={`font-playfair text-xl font-bold ${i===0?'gradient-text-static':'text-white'}`}>{v}</div>
                  <div className="text-xs text-white/40 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[['Mathematics','09:00','present'],['Physics Lab','11:00','absent'],['Chemistry','14:00','holiday']].map(([s,t,st]) => (
                <div key={s} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white/90">{s}</div>
                    <div className="text-xs text-white/40 font-mono">{t}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium badge-${st}`}>{st}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true, margin:'-100px' }}
          className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {STATS.map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
              transition={{ delay:i*0.1, duration:0.5 }} viewport={{ once:true }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="font-playfair text-3xl font-bold gradient-text-static">{value}</div>
              <div className="text-sm text-white/50 mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="text-center mb-16"
          >
            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">
              Everything you need to
              <span className="gradient-text"> ace attendance</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Built specifically for Indian college students who need to maintain 75% attendance.
            </p>
          </motion.div>

          <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once:true, margin:'-80px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={stagger.item}
                className="glass-card rounded-2xl p-6 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 initial={{ opacity:0,y:24 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}
            className="font-playfair text-4xl font-bold text-center text-white mb-16"
          >
            Up and running in <span className="gradient-text">3 minutes</span>
          </motion.h2>
          <div className="space-y-6">
            {[
              { n:'01', t:'Upload your timetable', d:'Take a photo of your college timetable — printed, handwritten, or even a screenshot. Any format works.' },
              { n:'02', t:'AI does the heavy lifting', d:'Claude AI analyzes the image and extracts every subject, time slot, and day. You review and confirm in seconds.' },
              { n:'03', t:'Your semester is ready', d:'All sessions for the entire semester are generated automatically. Just start marking attendance every day.' },
            ].map(({ n, t, d }, i) => (
              <motion.div key={n} initial={{ opacity:0, x:-32 }} whileInView={{ opacity:1, x:0 }}
                transition={{ delay:i*0.15, duration:0.6 }} viewport={{ once:true }}
                className="glass-card rounded-2xl p-6 flex gap-6 items-start"
              >
                <div className="font-mono text-4xl font-bold gradient-text-static opacity-60 shrink-0 leading-none">{n}</div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-1">{t}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
          className="max-w-2xl mx-auto text-center glass-card rounded-3xl p-12 glow-purple"
        >
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">
            Start your semester <span className="gradient-text">right</span>
          </h2>
          <p className="text-white/50 mb-8">Join thousands of students who never worry about attendance again.</p>
          <Link href="/auth/register"
            className="inline-block px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-white transition-all btn-glow hover:scale-105 hover:shadow-[0_0_60px_rgba(124,58,237,0.5)]"
          >
            Create free account →
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="font-playfair text-xl gradient-text-static font-bold">Scholr</span>
          <p className="text-white/30 text-xs max-w-md mx-auto">
            AI-powered attendance tracking for college students. Never fall below 75% again.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-white/25">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-white/50 transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-white/50 transition-colors">Contact</Link>
          </div>
          <p className="text-white/15 text-xs">© 2026 Scholr · Built with Claude AI</p>
        </div>
      </footer>
    </div>
  );
}
