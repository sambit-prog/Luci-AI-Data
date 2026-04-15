import { useState } from 'react';
import { Check, Search, Database, Mail, Linkedin, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandName } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface FAQItem {
  question: string;
  answer: string;
}

function LandingPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [productsOpen, setProductsOpen] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<'verifier' | 'radar'>('verifier');
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

  const verifierPlans = [
    { verifications: 10000, priceInr: 850, pricePaise: 8.5, popular: false },
    { verifications: 25000, priceInr: 1750, pricePaise: 7, popular: false },
    { verifications: 100000, priceInr: 4500, pricePaise: 4.5, popular: true },
    { verifications: 250000, priceInr: 10000, pricePaise: 4, popular: true },
    { verifications: 500000, priceInr: 15000, pricePaise: 3, popular: false },
    { verifications: 1000000, priceInr: 25000, pricePaise: 2.5, popular: false },
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
              {/* Products Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition">
                  <span>Products</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {productsOpen && (
                  <div className="absolute top-full left-0 pt-4 w-64 z-50">
                    <div className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
                      <Link
                        to="/product/lead-finder"
                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="bg-brand-orange/10 p-2 rounded-lg group-hover:bg-brand-orange/20 transition-colors">
                          <Search className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div>
                          <div className="text-white font-medium mb-0.5">Luci Radar</div>
                          <div className="text-xs text-gray-400">Discover B2B contacts instantly</div>
                        </div>
                      </Link>
                      <Link
                        to="/product/email-verifier"
                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="bg-brand-orange/10 p-2 rounded-lg group-hover:bg-brand-orange/20 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div>
                          <div className="text-white font-medium mb-0.5">Luci Verifier</div>
                          <div className="text-xs text-gray-400">Clean lists & protect sender rep</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition">Platform</a>
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
              <span>Lead Finding & Email Verification Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The All-in-One Platform to
              <span className="block text-gradient-orange">Fuel Your Outreach</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Everything you need to discover high-quality leads and verify them instantly. One powerful platform designed to maximize your pipeline.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={handleExportLeads}
                className="btn-gradient-primary text-white px-8 py-4 rounded-xl shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all font-medium flex items-center gap-2 text-lg w-full sm:w-auto justify-center"
              >
                Get Started
              </button>
              <a
                href="#how-it-works"
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl transition-all font-medium flex items-center gap-2 text-lg w-full sm:w-auto justify-center"
              >
                Explore Platform
              </a>
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

      {/* Platform Features */}
      <section id="how-it-works" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">One Platform. Two Core Services.</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to build and maintain high-quality outreach lists.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Lead Finder Feature */}
            <Link to="/product/lead-finder" className="relative group block h-full">
              <div className="glass-dark backdrop-blur-sm border border-gray-700 rounded-3xl p-10 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 ease-in-out h-full flex flex-col cursor-pointer">
                <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Luci Radar</h3>
                <p className="text-gray-400 leading-relaxed text-lg mb-8 flex-1">
                  Discover highly targeted prospects in seconds. Filter by industry, location, job title, and company size to build the perfect outreach list.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> Access millions of verified profiles</li>
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> Export data with a single click</li>
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> Seamlessly integrate with your CRM</li>
                </ul>
                <div className="mt-auto px-6 py-3 rounded-xl border border-brand-orange/50 text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors font-semibold w-full sm:w-max text-center block">
                  Explore Luci Radar
                </div>
              </div>
            </Link>

            {/* Email Verifier Feature */}
            <Link to="/product/email-verifier" className="relative group block h-full">
              <div className="glass-dark backdrop-blur-sm border border-gray-700 rounded-3xl p-10 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 ease-in-out h-full flex flex-col cursor-pointer">
                <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Luci Verifier</h3>
                <p className="text-gray-400 leading-relaxed text-lg mb-8 flex-1">
                  Keep your sender reputation pristine. Clean your lists in bulk or verify individual emails in real-time before you hit send.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> Eliminate hard bounces</li>
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> Bulk CSV upload & processing</li>
                  <li className="flex items-center text-gray-300"><Check className="w-5 h-5 text-brand-orange mr-3" /> 99% accuracy guarantee</li>
                </ul>
                <div className="mt-auto px-6 py-3 rounded-xl border border-brand-orange/50 text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors font-semibold w-full sm:w-max text-center block">
                  Explore Luci Verifier
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </div>

          {/* Outer Glass Card */}
          <div className="glass-dark border border-gray-700 rounded-3xl p-6 md:p-8">

            {/* Tab Switcher */}
            <div className="flex justify-center mb-7">
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-1 flex gap-1">
                <button
                  onClick={() => setActivePricingTab('verifier')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${activePricingTab === 'verifier'
                    ? 'btn-gradient-primary text-white shadow-lg shadow-brand-orange/30'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Luci Verifier
                </button>
                <button
                  onClick={() => setActivePricingTab('radar')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${activePricingTab === 'radar'
                    ? 'btn-gradient-primary text-white shadow-lg shadow-brand-orange/30'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Search className="w-4 h-4" />
                  Luci Radar
                </button>
              </div>
            </div>

            {/* Luci Verifier Pricing */}
            {activePricingTab === 'verifier' && (
              <div>
                {/* Table Header */}
                <div className="flex items-center gap-3 pl-[14px] pr-3 pb-3 border-b border-gray-700/60">
                  <div className="flex-1 text-xs text-gray-500 uppercase tracking-wider font-medium">Volume</div>
                  <div className="w-20 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Price</div>
                  <div className="hidden sm:block w-24 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Per Email</div>
                  <div className="w-24"></div>
                </div>

                {/* Plan Rows */}
                <div className="divide-y divide-gray-700/30">
                  {verifierPlans.map((plan) => (
                    <div
                      key={plan.verifications}
                      className={`flex items-center gap-3 pl-3 pr-3 py-3 transition-colors border-l-2 ${plan.popular
                        ? 'bg-green-500/10 border-l-green-500'
                        : 'hover:bg-white/[0.04] border-l-transparent'
                        }`}
                    >
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-white text-sm font-medium">
                          {plan.verifications.toLocaleString('en-IN')}
                          <span className="text-gray-500 font-normal ml-1 text-xs">emails</span>
                        </span>
                        {plan.popular && (
                          <span className="flex-shrink-0 bg-brand-orange text-white px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="w-20 text-right text-white font-bold text-sm">
                        ₹{plan.priceInr.toLocaleString('en-IN')}
                      </div>
                      <div className={`hidden sm:block w-24 text-right text-xs ${plan.popular ? 'text-green-400 font-medium' : 'text-gray-500'}`}>
                        {plan.pricePaise}p / email
                      </div>
                      <div className="w-24 flex justify-end">
                        <Link
                          to="/auth"
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${plan.popular
                            ? 'btn-gradient-primary text-white shadow shadow-brand-orange/30'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            }`}
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enterprise Row */}
                <div className="mt-4 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row sm:items-center gap-3 px-3">
                  <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs text-brand-orange font-semibold uppercase tracking-wider">Enterprise</span>
                    <span className="text-sm text-white font-medium">More than 10,00,000 emails?</span>
                    <span className="hidden sm:inline text-sm text-gray-400">Get custom volume pricing.</span>
                  </div>
                  <a href="#" className="btn-gradient-primary text-white px-5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shadow shadow-brand-orange/30 text-center sm:flex-shrink-0">
                    Contact Sales
                  </a>
                </div>
              </div>
            )}

            {/* Luci Radar Coming Soon */}
            {activePricingTab === 'radar' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gradient-to-br from-brand-orange/20 to-primary-violet/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Search className="h-8 w-8 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Luci Radar Pricing</h3>
                <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse inline-block"></span>
                  Coming Soon
                </div>
                <p className="text-gray-400 leading-relaxed max-w-sm">
                  We're finalizing our lead finder pricing. Transparent, competitive, and built for scale — stay tuned.
                </p>
              </div>
            )}

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
                className="glass-dark rounded-xl border border-white/10 overflow-hidden hover:shadow-xl hover:shadow-brand-orange/90 transition"
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
      <section className="py-10 bg-gradient-to-tr from-brand-orange to-primary-violet relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Scale Your Outreach?
          </h2>
          <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses getting high-quality, verified leads and improving their sender reputation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <Link to="/auth" className="bg-white text-brand-orange px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-2xl w-full sm:w-auto">
              Start Finding Leads
            </Link>
          </div>
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
