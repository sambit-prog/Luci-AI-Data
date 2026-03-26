import React from 'react';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS, PlanId } from '../../../services/paymentService';

interface PricingPlanSelectorProps {
    selectedPlanId: PlanId | null;
    onSelect: (planId: PlanId) => void;
}

export const PricingPlanSelector: React.FC<PricingPlanSelectorProps> = ({ selectedPlanId, onSelect }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRICING_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                    <button
                        key={plan.id}
                        onClick={() => onSelect(plan.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                                ? 'border-brand-orange bg-brand-orange/10'
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                    >
                        {plan.popular && (
                            <span className="absolute -top-2 left-3 bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Popular
                            </span>
                        )}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-lg font-bold text-white">
                                    {plan.credits.toLocaleString()} <span className="text-sm font-medium text-gray-400">credits</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    ${(plan.price_usd / plan.credits).toFixed(4)}/credit
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-brand-orange">${plan.price_usd}</p>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-brand-orange ml-auto mt-1" />
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
