import React, { useState } from 'react';
import { Search, Building2, MapPin, Briefcase, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LeadFinder: React.FC = () => {
    const { user } = useAuth();
    const [industry, setIndustry] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState('');
    const [creditError, setCreditError] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if ((user?.leadFinderCredits ?? 0) <= 0) {
            setCreditError(true);
            return;
        }
        setCreditError(false);
        // Demo only: no actual search
        alert('This is a demo. Lead Finder search functionality is coming soon!');
    };

    return (
        <div className="space-y-6">
            <div className="glass-dark rounded-2xl shadow-lg p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Demo Mode
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Luci Radar</h2>
                <p className="text-gray-400 mb-6">Search and export high-quality leads based on your target criteria.</p>

                {creditError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-4">
                        <p className="text-red-400 text-sm font-medium">You don't have enough Luci Radar credits.</p>
                        <a href="/dashboard?view=billing" className="flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline whitespace-nowrap">
                            <ShoppingCart className="w-4 h-4" /> Buy Credits
                        </a>
                    </div>
                )}

                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-brand-orange" /> Role / Title
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Marketing Director"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-orange" /> Industry
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Software, Healthcare"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-orange" /> Location
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. New York, Remote"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end mt-2">
                        <button
                            type="submit"
                            className="btn-gradient-primary text-white px-8 py-3 rounded-lg shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all font-medium flex items-center gap-2"
                        >
                            <Search className="w-5 h-5" />
                            Find Leads
                        </button>
                    </div>
                </form>

                <div className="border-t border-white/10 pt-8 relative">
                    {/* Overlay for "Coming Soon" */}
                    <div className="absolute inset-x-0 bottom-0 top-8 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-white/5">
                        <div className="bg-gradient-to-br from-brand-orange to-primary-violet w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                        <p className="text-gray-400 text-center max-w-sm">
                            We're putting the finishing touches on our intelligent lead finding engine. Check back soon!
                        </p>
                    </div>

                    {/* Mock Table visually behind the overlay */}
                    <h3 className="text-lg font-semibold text-white mb-4">Preview Results</h3>
                    <div className="overflow-x-auto opacity-50 select-none">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Company</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Email Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-white">John Doe {i}</div>
                                            <div className="text-xs text-gray-500">Marketing VP</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">Tech Corp Inc.</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                Verified
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
