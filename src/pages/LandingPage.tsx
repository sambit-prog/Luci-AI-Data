import { useState } from 'react';
import { Check, Download, CreditCard, Search, Database, Mail, Building2, MapPin, Linkedin, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandName } from '../config';
import { useAuth } from '../contexts/AuthContext';

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

interface FAQItem {
  question: string;
  answer: string;
}

function LandingPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchUrl, setSearchUrl] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleExportLeads = () => {
    if (user) {
      // User is logged in, navigate to dashboard
      navigate('/dashboard');
    } else {
      // User is not logged in, navigate to auth page
      navigate('/auth');
    }
  };

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

  const faqs: FAQItem[] = [
    {
      question: 'Is this service legal and compliant?',
      answer: 'Yes, we only collect publicly available information from business directories and verify it through third-party services. We comply with GDPR, CCPA, and other data protection regulations.'
    },
    {
      question: 'How long does processing take?',
      answer: 'Most exports are processed within 24-48 hours. Larger datasets (10,000+ leads) may take up to 72 hours. You\'ll receive an email notification when your file is ready.'
    },
    {
      question: 'Do credits expire?',
      answer: 'Credits are valid for 30 days from the date of purchase. We recommend purchasing only what you need for the month as unused credits do not roll over.'
    },
    {
      question: 'What data format do you provide?',
      answer: 'All exports are delivered as clean CSV files that work seamlessly with Excel, Google Sheets, Salesforce, HubSpot, and other major CRM platforms.'
    },
    {
      question: 'What if I need more credits?',
      answer: 'You can purchase additional credits anytime from your dashboard. Volume discounts are automatically applied for larger purchases.'
    },
    {
      question: 'How accurate is the data?',
      answer: 'We verify all email addresses and phone numbers through multiple validation services. Our data accuracy rate exceeds 95% for email deliverability.'
    }
  ];

  const pricingPlans = [
    { credits: 1000, price: 15, perLead: 0.015, popular: false },
    { credits: 5000, price: 55, perLead: 0.011, popular: true },
    { credits: 10000, price: 95, perLead: 0.0095, popular: false },
    { credits: 25000, price: 200, perLead: 0.008, popular: false }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation - Glassmorphism */}
      <nav className="glass backdrop-blur-lg sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-brand-orange" />
              <span className="text-xl font-bold text-white">{BrandName}</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition">FAQ</a>
              <Link to="/auth" className="btn-gradient-primary text-white px-6 py-2 rounded-lg shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/50 transition-all font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark with Animated Blobs */}
      <section className="relative bg-hero-gradient pt-20 pb-32 overflow-hidden">
        {/* Animated Blob Backgrounds */}
        <div className="blob-orange w-96 h-96 top-20 -left-20" />
        <div className="blob-blue w-80 h-80 bottom-20 -right-20" />
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Database className="h-4 w-4" />
              <span>Verified Business Leads Export Service</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Get Verified B2B Leads
              <span className="block text-gradient-orange">At Scale, Instantly</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Export thousands of verified business contacts from leading directories.
              Pay only for what you use—no expensive subscriptions or unused credits.
            </p>

            {/* URL Input */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="glass-strong rounded-xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3 bg-white/10 rounded-lg border border-white/10">
                  <Search className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Paste your search URL here..."
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleExportLeads}
                  className="btn-gradient-primary text-white px-8 py-3 rounded-lg shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all font-medium whitespace-nowrap"
                >
                  Export Leads
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-primary-green" />
                <span>95%+ Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>24-48h Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Export thousands of verified leads in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="glass-dark rounded-2xl p-8 h-full border border-white/10 hover:shadow-2xl hover:shadow-brand-orange/10 transition">
                <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-orange/50">
                  1
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Purchase Credits</h3>
                <p className="text-gray-400 leading-relaxed">
                  Choose a credit package that fits your needs. Credits are valid for 30 days with no auto-renewal.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="glass-dark rounded-2xl p-8 h-full border border-white/10 hover:shadow-2xl hover:shadow-brand-orange/10 transition">
                <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-orange/50">
                  2
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Submit Search URL</h3>
                <p className="text-gray-400 leading-relaxed">
                  Apply your filters on any supported platform, copy the URL, and paste it into your dashboard.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="glass-dark rounded-2xl p-8 h-full border border-white/10 hover:shadow-2xl hover:shadow-brand-orange/10 transition">
                <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-orange/50">
                  3
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Download Results</h3>
                <p className="text-gray-400 leading-relaxed">
                  We scrape, verify, and deliver a clean CSV file with validated emails within 24-48 hours.
                </p>
              </div>
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

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
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

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </div>

          {/* Comparison Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why pay 5x more?</h3>
            <p className="text-gray-700 text-lg mb-4">
              Traditional platforms charge <span className="font-bold text-red-600">$250</span> for 10,000 verified leads.
            </p>
            <p className="text-gray-700 text-lg">
              With {BrandName}, get the same quality data for just <span className="font-bold text-green-600">$95</span>
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold text-lg">
              <span>Save 62% on every export</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.credits}
                className={`relative rounded-2xl p-8 border-2 transition hover:shadow-2xl ${plan.popular
                  ? 'border-brand-orange bg-gradient-to-br from-brand-orange/10 to-primary-violet/10 glass'
                  : 'border-white/10 glass-dark hover:border-brand-orange/30'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-orange text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg shadow-brand-orange/50">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    ${plan.price}
                  </div>
                  <div className="text-gray-400 mb-6">
                    {plan.credits.toLocaleString()} credits
                  </div>
                  <div className="text-sm text-gray-500 mb-6">
                    ${plan.perLead.toFixed(4)} per lead
                  </div>
                  <Link to="/auth" className={`w-full py-3 rounded-lg font-medium transition block text-center ${plan.popular
                    ? 'btn-gradient-primary text-white shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}>
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about our service
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass-dark rounded-xl border border-white/10 overflow-hidden hover:shadow-xl hover:shadow-brand-orange/10 transition"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-white text-lg">{faq.question}</span>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Orange Gradient */}
      <section className="py-10 bg-gradient-to-br from-brand-orange to-primary-violet relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Scale Your Outreach?
          </h2>
          <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses getting high-quality, verified leads at a fraction of the cost.
          </p>
          <Link to="/auth" className="bg-white text-brand-orange px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-2xl inline-block">
            Start Exporting Leads
          </Link>
          <div className="mt-6 flex items-center justify-center space-x-8 text-white/90">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>No subscription required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-6 w-6 text-brand-orange" />
                <span className="text-lg font-bold text-white">{BrandName}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The smartest way to export verified B2B leads at scale without expensive subscriptions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-orange transition">How It Works</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">API Documentation</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Integration</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-orange transition">About Us</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Blog</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Careers</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-orange transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">GDPR Compliance</a></li>
                <li><a href="#" className="hover:text-brand-orange transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 {BrandName} Inc. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-brand-orange transition">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-orange transition">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
