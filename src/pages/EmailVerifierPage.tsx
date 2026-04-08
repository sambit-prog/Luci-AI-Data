import { CheckCircle2, Shield, Settings, Zap, Database, ChevronRight } from 'lucide-react';
import { EmailVerifierSimulator } from '../components/landing/EmailVerifierSimulator';
import { Link, useNavigate } from 'react-router-dom';
import { BrandName } from '../config';

export const EmailVerifierPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard?view=email-verifier');
  };

  return (
    <div className="min-h-screen bg-gray-900 border-t border-brand-orange/20">
      {/* Mini Nav */}
      <nav className="glass backdrop-blur-lg sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-brand-orange" />
              <span className="text-lg font-bold text-white">{BrandName}</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-400 hover:text-white px-3 py-2 transition">Home</Link>
              <Link to="/product/lead-finder" className="text-gray-400 hover:text-white px-3 py-2 transition">Luci Radar</Link>
              <button onClick={handleGetStarted} className="btn-gradient-primary text-white px-6 py-2 rounded-lg shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/50 transition-all font-medium">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-gray-900 border-b border-white/5">
        {/* Animated background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/20 rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/80 to-gray-900"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Text Content */}
            <div className="text-left text-white max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-[0_0_15px_rgba(255,107,0,0.15)]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Enterprise Email Verification</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Protect Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">
                  Sender Reputation
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light">
                Eliminate hard bounces and land straight in the inbox. Verify thousands of emails in seconds with our high-accuracy bulk processing engine.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <button
                  onClick={handleGetStarted}
                  className="group relative px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg overflow-hidden shadow-[0_0_40px_rgba(255,107,0,0.3)] hover:shadow-[0_0_60px_rgba(255,107,0,0.5)] transition-all duration-300 flex items-center"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
                  <span className="relative flex items-center gap-2">
                    Access Luci Verifier <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Trust Badges */}
                <div className="flex items-center gap-4 text-sm text-gray-400 font-medium hidden sm:flex">
                  <div className="flex -space-x-3">
                    <img src="https://i.pravatar.cc/100?img=33" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=47" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=12" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-xs font-bold text-white z-10">+2k</div>
                  </div>
                  <span>Trusted by <br />top marketers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="relative hidden lg:block">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/30 to-brand-orange/5 blur-[80px] -z-10 rounded-full mix-blend-screen opacity-70"></div>

              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 transition-transform duration-500 hover:-translate-y-2 hover:shadow-brand-orange/20">
                {/* Mockup Top Bar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-gray-400 font-mono flex items-center gap-2 border border-white/5">
                    <Database className="w-3 h-3" />
                    verification_engine_v2.0
                  </div>
                </div>

                {/* Mockup Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-colors hover:bg-white/10">
                    <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-brand-orange" />
                      Total Checked
                    </div>
                    <div className="text-2xl font-bold text-white">12,450</div>
                  </div>
                  <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-xl p-4 transition-colors hover:bg-brand-orange/20">
                    <div className="text-brand-orange py-0 text-sm mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Deliverable
                    </div>
                    <div className="text-2xl font-bold text-brand-orange">98.2%</div>
                  </div>
                </div>

                {/* Mockup List */}
                <div className="space-y-3">
                  {[
                    { email: 'alex@startup.io', status: 'Valid', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                    { email: 'sarah.j@enterprise.com', status: 'Valid', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                    { email: 'contact@baddomain.net', status: 'Bounced', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
                    { email: 'dev@unknown.co', status: 'Risky', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-700">
                          {row.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-300 font-medium">{row.email}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${row.bg} ${row.color} border ${row.border}`}>
                        {row.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Element 1 */}
              <div className="absolute -right-8 top-1/4 bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">MX Verified</div>
                    <div className="text-xs text-gray-400">Real-time check</div>
                  </div>
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute -left-12 bottom-1/4 bg-gray-900 border border-brand-orange/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(255,107,0,0.15)] backdrop-blur-xl transition-transform hover:scale-105 cursor-default z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center border border-brand-orange/30">
                    <Zap className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Lightning Fast</div>
                    <div className="text-xs text-gray-400">6k emails / hour</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-dark border border-gray-700 rounded-2xl p-8 hover:border-brand-orange transition-all">
              <Shield className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">99% Accuracy</h3>
              <p className="text-gray-400">Our deep verification layers check MX records, SMPT handshakes, and catch-all status.</p>
            </div>
            <div className="glass-dark border border-gray-700 rounded-2xl p-8 hover:border-brand-orange transition-all">
              <Zap className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Instant Bulk Upload</h3>
              <p className="text-gray-400">Drag and drop massive CSV files. We process them completely client-side for maximum speed and security.</p>
            </div>
            <div className="glass-dark border border-gray-700 rounded-2xl p-8 hover:border-brand-orange transition-all">
              <Settings className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Detailed Statuses</h3>
              <p className="text-gray-400">Identify Valid, Invalid, and Risky emails instantly, so you can decide who makes the cut.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator */}
      <section className="py-24 bg-gray-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Live Demo</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">See It Work in Real Time</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every verification step, exactly as it runs in production. No signup needed.
            </p>
          </div>
          <EmailVerifierSimulator />
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 bg-gradient-to-tr from-brand-orange/20 to-gray-900 text-center border-t border-brand-orange/10">
        <h2 className="text-3xl font-bold text-white mb-6">Start verifying your lists today</h2>
        <button
          onClick={handleGetStarted}
          className="bg-brand-orange text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition shadow-2xl"
        >
          Open Dashboard
        </button>
      </section>
    </div>
  );
};
