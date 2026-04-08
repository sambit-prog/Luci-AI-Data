import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'pass' | 'fail' | 'warn';

interface SimResult {
  email: string;
  status: 'valid' | 'invalid' | 'risky';
  reason: string;
  elapsed_ms: number;
  checks: {
    syntax: boolean;
    mx_found: boolean;
    catch_all: boolean;
    disposable: boolean;
    role_based: boolean;
    mx_host: string;
  };
  stepStatuses: StepStatus[];
}

// ─── Preset demos ─────────────────────────────────────────────────────────────

const DEMOS: SimResult[] = [
  {
    email: 'alex@startup.io',
    status: 'valid',
    reason: 'deliverable',
    elapsed_ms: 312,
    checks: { syntax: true, mx_found: true, catch_all: false, disposable: false, role_based: false, mx_host: 'aspmx.l.google.com' },
    stepStatuses: ['pass', 'pass', 'pass', 'pass', 'pass'],
  },
  {
    email: 'test@mailinator.com',
    status: 'risky',
    reason: 'disposable_email',
    elapsed_ms: 289,
    checks: { syntax: true, mx_found: true, catch_all: true, disposable: true, role_based: false, mx_host: 'mail.mailinator.com' },
    stepStatuses: ['pass', 'pass', 'pass', 'pass', 'warn'],
  },
  {
    email: 'info@company.com',
    status: 'risky',
    reason: 'role_based_address',
    elapsed_ms: 401,
    checks: { syntax: true, mx_found: true, catch_all: false, disposable: false, role_based: true, mx_host: 'mx.company.com' },
    stepStatuses: ['pass', 'pass', 'pass', 'pass', 'warn'],
  },
  {
    email: 'notanemail',
    status: 'invalid',
    reason: 'invalid_syntax',
    elapsed_ms: 4,
    checks: { syntax: false, mx_found: false, catch_all: false, disposable: false, role_based: false, mx_host: '' },
    stepStatuses: ['fail', 'pending', 'pending', 'pending', 'pending'],
  },
];

const STEP_LABELS = ['Syntax', 'Domain', 'MX Records', 'SMTP', 'Risk'];
const STEP_DURATIONS = [600, 850, 900, 1150, 700]; // ms per step

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: SimResult['status']) {
  if (status === 'valid')
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Valid</span>;
  if (status === 'risky')
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Risky</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Invalid</span>;
}

function CheckPill({ label, value, invert = false }: { label: string; value: boolean; invert?: boolean }) {
  const good = invert ? !value : value;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
      good ? 'bg-green-500/5 border-green-500/15 text-green-400' : 'bg-red-500/5 border-red-500/15 text-red-400'
    }`}>
      {good
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <XCircle className="w-3.5 h-3.5 shrink-0" />}
      {label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmailVerifierSimulator() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(Array(5).fill('pending'));
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<SimResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearAll() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function push(t: ReturnType<typeof setTimeout>) {
    timeoutsRef.current.push(t);
  }

  function runDemo(index: number) {
    clearAll();
    const demo = DEMOS[index];
    const stepCount = demo.stepStatuses[0] === 'fail' ? 1 : 5;

    setResult(null);
    setStepStatuses(Array(5).fill('pending'));
    setCurrentStep(-1);
    setIsRunning(true);

    let elapsed = 200;

    for (let i = 0; i < stepCount; i++) {
      const start = elapsed;
      const dur = STEP_DURATIONS[i];

      push(setTimeout(() => {
        setCurrentStep(i);
        setStepStatuses(prev => { const n = [...prev]; n[i] = 'running'; return n; });
      }, start));

      push(setTimeout(() => {
        setStepStatuses(prev => { const n = [...prev]; n[i] = demo.stepStatuses[i]; return n; });
        if (i === stepCount - 1) {
          push(setTimeout(() => {
            setCurrentStep(-1);
            setIsRunning(false);
            setResult(demo);
          }, 300));
        }
      }, start + dur));

      elapsed += dur + 120;
    }

    // After result shown, pause then move to next demo
    const totalTime = elapsed + 300 + 2800;
    push(setTimeout(() => {
      const next = (index + 1) % DEMOS.length;
      setDemoIndex(next);
      runDemo(next);
    }, totalTime));
  }

  useEffect(() => {
    runDemo(0);
    return () => clearAll();
  }, []);

  const demo = DEMOS[demoIndex];

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">

      {/* ── LEFT: Step progress ── */}
      <div className="glass-dark rounded-2xl p-6 border border-white/10 space-y-2">
        {/* Current email being tested */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-brand-orange" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Verifying</p>
            <p className="text-sm font-mono text-white truncate">{demo.email}</p>
          </div>
          {isRunning && (
            <Loader2 className="w-4 h-4 text-brand-orange animate-spin ml-auto shrink-0" />
          )}
        </div>

        {/* Steps */}
        {STEP_LABELS.map((label, i) => {
          const status = stepStatuses[i];
          const isActive = currentStep === i;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-white/5 border border-white/10' : 'border border-transparent'
              }`}
            >
              {/* Status icon */}
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {status === 'pending' && <div className="w-3 h-3 rounded-full border border-white/20" />}
                {status === 'running' && <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />}
                {status === 'pass'    && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {status === 'warn'    && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                {status === 'fail'    && <XCircle className="w-4 h-4 text-red-400" />}
              </div>

              <span className={`text-sm font-medium transition-colors duration-300 ${
                status === 'pending' ? 'text-gray-600' :
                status === 'running' ? 'text-white' :
                status === 'pass'    ? 'text-gray-300' :
                status === 'warn'    ? 'text-yellow-300' :
                'text-red-300'
              }`}>
                {label}
              </span>

              {/* Running dots */}
              {status === 'running' && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"
                      style={{ animationDelay: `${j * 150}ms` }} />
                  ))}
                </div>
              )}

              {/* Step timing (shown when complete) */}
              {(status === 'pass' || status === 'warn' || status === 'fail') && !isActive && (
                <span className="ml-auto text-xs text-gray-600 font-mono">
                  {Math.floor(Math.random() * 150 + 80)}ms
                </span>
              )}
            </div>
          );
        })}

        {/* Demo cycle indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {DEMOS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === demoIndex ? 'bg-brand-orange w-4' : 'bg-white/20'
            }`} />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Result card (matches real service) ── */}
      <div className="space-y-3">
        {result ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
            {/* Header row */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Result for</p>
                  <p className="font-medium text-white font-mono text-sm">{result.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{result.elapsed_ms}ms</span>
                {getStatusBadge(result.status)}
              </div>
            </div>

            {/* Detail panel */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Reason</p>
                <p className="text-sm text-white font-mono">{result.reason.replace(/_/g, ' ')}</p>
              </div>
              {result.checks.mx_host && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">MX Host</p>
                  <p className="text-sm text-white font-mono">{result.checks.mx_host}</p>
                </div>
              )}
              <div className="border-t border-white/5 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CheckPill label="Syntax"     value={result.checks.syntax} />
                <CheckPill label="MX Found"   value={result.checks.mx_found} />
                <CheckPill label="Catch-All"  value={result.checks.catch_all}  invert />
                <CheckPill label="Disposable" value={result.checks.disposable} invert />
                <CheckPill label="Role-Based" value={result.checks.role_based} invert />
              </div>
            </div>
          </div>
        ) : (
          /* Skeleton while steps are running */
          <div className="space-y-3 animate-pulse">
            <div className="h-[74px] rounded-xl bg-white/5 border border-white/10" />
            <div className="h-[160px] rounded-xl bg-white/5 border border-white/10" />
          </div>
        )}
      </div>

    </div>
  );
}
