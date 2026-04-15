import React from 'react';
import { Check, Zap } from 'lucide-react';
import { getPlansByServiceType, PlanId, ServiceType } from '../../../services/paymentService';

interface PricingPlanSelectorProps {
    serviceType: ServiceType;
    selectedPlanId: PlanId | null;
    onSelect: (planId: PlanId) => void;
}

export const PricingPlanSelector: React.FC<PricingPlanSelectorProps> = ({ serviceType, selectedPlanId, onSelect }) => {
    const plans = getPlansByServiceType(serviceType);
    const isVerifier = serviceType === 'email_verifier';
    const unit = isVerifier ? 'verifications' : 'credits';

    const selectedBorder = isVerifier
        ? 'border-green-500 bg-green-500/10'
        : 'border-brand-orange bg-brand-orange/10';
    const priceColor = isVerifier ? 'text-green-400' : 'text-brand-orange';
    const checkColor = isVerifier ? 'text-green-400' : 'text-brand-orange';
    const badgeBg = isVerifier ? 'bg-green-500' : 'bg-brand-orange';

    return (
        <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                    <button
                        key={plan.id}
                        onClick={() => onSelect(plan.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                                ? selectedBorder
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                    >
                        {plan.popular && (
                            <span className={`absolute -top-2 left-3 ${badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                <Zap className="w-3 h-3" /> Popular
                            </span>
                        )}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-lg font-bold text-white leading-tight">
                                    {plan.credits.toLocaleString()}
                                </p>
                                <p className="text-xs font-medium text-gray-400">{unit}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {plan.unit_price_display}
                                </p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                                <p className={`text-base font-bold ${priceColor}`}>{plan.price_display}</p>
                                {isSelected && (
                                    <Check className={`w-4 h-4 ${checkColor} ml-auto mt-1`} />
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
