import { Search, CheckCircle2, Database, Download, Users, ChevronRight, Building2, Mail, MapPin, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandName } from '../config';

interface Lead {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  status: string;
  seniority: string;
  location: string;
  industry: string;
  employees: string;
  linkedin: string;
  phone: string;
}

export const LeadFinderPage = () => {
  const navigate = useNavigate();

  const sampleLeads: Lead[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'VP of Marketing',
      company: 'TechCorp Inc',
      email: '[email protected]',
      status: 'Verified',
      seniority: 'VP',
      location: 'San Francisco, CA',
      industry: 'Technology',
      employees: '500-1000',
      linkedin: 'linkedin.com/in/sarahjohnson',
      phone: '+1 (555) 123-4567'
    },
    {
      id: 2,
      name: 'Michael Chen',
      title: 'Director of Sales',
      company: 'Growth Solutions',
      email: '[email protected]',
      status: 'Verified',
      seniority: 'Director',
      location: 'New York, NY',
      industry: 'SaaS',
      employees: '200-500',
      linkedin: 'linkedin.com/in/michaelchen',
      phone: '+1 (555) 234-5678'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'Chief Technology Officer',
      company: 'Innovate Labs',
      email: '[email protected]',
      status: 'Verified',
      seniority: 'C-Level',
      location: 'Austin, TX',
      industry: 'Software',
      employees: '100-200',
      linkedin: 'linkedin.com/in/emilyrodriguez',
      phone: '+1 (555) 345-6789'
    }
  ];

  const handleGetStarted = () => {
    navigate('/dashboard?view=lead-finder');
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
               <Link to="/product/email-verifier" className="text-gray-400 hover:text-white px-3 py-2 transition">Luci Verifier</Link>
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
                <Search className="h-4 w-4" />
                <span>B2B Lead Generation</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Discover Your Next <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">
                  Biggest Customers
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light">
                Gain access to millions of verified B2B profiles. Filter by exact criteria, industry, and role to build highly targeted lists in seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <button
                  onClick={handleGetStarted}
                  className="group relative px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg overflow-hidden shadow-[0_0_40px_rgba(255,107,0,0.3)] hover:shadow-[0_0_60px_rgba(255,107,0,0.5)] transition-all duration-300 flex items-center"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
                  <span className="relative flex items-center gap-2">
                    Access Luci Radar <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                {/* Trust Badges */}
                <div className="flex items-center gap-4 text-sm text-gray-400 font-medium hidden sm:flex">
                  <div className="flex -space-x-3">
                    <img src="https://i.pravatar.cc/100?img=59" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=8" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=32" className="w-10 h-10 rounded-full border-2 border-gray-900" alt="User" />
                    <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-xs font-bold text-white z-10">+5k</div>
                  </div>
                  <span>Trusted by <br/>sales teams</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="relative hidden lg:block">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/30 to-purple-600/20 blur-[80px] -z-10 rounded-full mix-blend-screen opacity-70"></div>
              
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 transition-transform duration-500 hover:-translate-y-2 hover:shadow-brand-orange/20">
                
                {/* Mockup Search Bar */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="w-full bg-white/5 border border-white/10 text-gray-300 rounded-xl pl-12 pr-4 py-4 text-sm font-medium flex items-center justify-between">
                    <span>VP of Marketing, Software...</span>
                    <div className="px-3 py-1.5 bg-brand-orange text-white text-xs rounded-md shadow-lg font-bold tracking-wide">SEARCH</div>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 mb-6 overflow-hidden">
                  {['Software', 'San Francisco', '500-1000 emp', 'Director+'].map((filter, i) => (
                     <div key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1 whitespace-nowrap">
                       {filter}
                       <div className="w-3 h-3 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer opacity-50">&times;</div>
                     </div>
                  ))}
                </div>

                {/* Results List */}
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Jenkins', role: 'VP of Marketing', company: 'TechFlow', img: '1', verified: true },
                    { name: 'Marcus Doa', role: 'Chief Marketing Officer', company: 'Innovate.io', img: '2', verified: true },
                    { name: 'Elena Rostova', role: 'Director of Growth', company: 'CloudBase', img: '3', verified: false },
                  ].map((profile, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default group">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <img src={`https://i.pravatar.cc/100?img=${profile.img}`} className="w-12 h-12 rounded-full border border-gray-700" alt={profile.name} />
                          <div>
                            <div className="text-white font-semibold flex items-center gap-2">
                              {profile.name}
                              {profile.verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                            </div>
                            <div className="text-brand-orange text-sm font-medium">{profile.role}</div>
                            <div className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" /> {profile.company}
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors cursor-pointer">
                            <Download className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating Element 1 */}
              <div className="absolute -right-8 top-1/3 bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Database className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">250M+</div>
                    <div className="text-xs text-gray-400">Verified Contacts</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Element 2 */}
              <div className="absolute -left-12 bottom-1/4 bg-gray-900 border border-green-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.15)] backdrop-blur-xl transition-transform hover:scale-105 cursor-default z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Precise Targeting</div>
                    <div className="text-xs text-gray-400">100+ data points</div>
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
              <Users className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Targeted Search</h3>
              <p className="text-gray-400">Search by job title, company name, industry, location, and company size to find your ideal buyers.</p>
            </div>
            <div className="glass-dark border border-gray-700 rounded-2xl p-8 hover:border-brand-orange transition-all">
              <CheckCircle2 className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Pre-Verified Data</h3>
              <p className="text-gray-400">We verify emails as we pull them, ensuring you don't waste time on bounced emails.</p>
            </div>
            <div className="glass-dark border border-gray-700 rounded-2xl p-8 hover:border-brand-orange transition-all">
              <Download className="w-10 h-10 text-brand-orange mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">1-Click Export</h3>
              <p className="text-gray-400">Export your carefully curated lists seamlessly to CSV for instant CRM integration.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Demo Leads */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Sample Lead Data</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See the exact format and quality of data you'll receive
            </p>
          </div>

          <div className="bg-white backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-white/70 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105 transition-all duration-300 ease-in-out group scroll-mt-24">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sampleLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-brand-orange to-primary-violet rounded-full flex items-center justify-center text-white font-medium">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-gray-900">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lead.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{lead.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 text-sm">{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 text-sm">{lead.location}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 bg-gradient-to-tr from-brand-orange/20 to-gray-900 text-center border-t border-brand-orange/10">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to find your ideal leads?</h2>
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
