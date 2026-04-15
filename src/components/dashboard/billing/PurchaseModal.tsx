import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { PricingPlanSelector } from './PricingPlanSelector';
import { ServiceType, PlanId, getPlansByServiceType, createOrder, verifyPayment } from '../../../services/paymentService';
import { useRazorpay } from '../../../hooks/useRazorpay';
import { useAuth } from '../../../contexts/AuthContext';

type ModalState = 'idle' | 'creating_order' | 'checkout_open' | 'verifying' | 'success' | 'error';

interface PurchaseModalProps {
    serviceType: ServiceType;
    serviceName: string;
    onClose: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ serviceType, serviceName, onClose }) => {
    const { updateCredits, user } = useAuth();
    const { openCheckout, isScriptLoaded } = useRazorpay();
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
    const [state, setState] = useState<ModalState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [successData, setSuccessData] = useState<{ creditsAdded: number; newBalance: number } | null>(null);

    const handlePay = async () => {
        if (!selectedPlan) return;

        const plan = getPlansByServiceType(serviceType).find(p => p.id === selectedPlan)!;
        const isTestMode = import.meta.env.VITE_TEST_PAYMENT_MODE === 'true';

        setState('creating_order');
        try {
            let orderData;

            if (isTestMode) {
                // Test mode: bypass edge function, force amount to ₹1 (100 paise)
                orderData = {
                    order_id: '',
                    amount: 100,
                    currency: 'INR',
                    razorpay_key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    prefill: { name: user?.fullName ?? '', email: user?.email ?? '' },
                };
            } else {
                orderData = await createOrder(serviceType, selectedPlan);
            }

            setState('checkout_open');

            openCheckout(
                orderData,
                async (razorpayResponse) => {
                    setState('verifying');
                    try {
                        let creditsAdded: number;
                        let newBalance: number;

                        if (isTestMode) {
                            // Test mode: skip verification, credit selected plan locally
                            creditsAdded = plan.credits;
                            const currentBalance = serviceType === 'lead_finder'
                                ? (user?.leadFinderCredits ?? 0)
                                : (user?.emailVerifierCredits ?? 0);
                            newBalance = currentBalance + creditsAdded;
                        } else {
                            const result = await verifyPayment(
                                razorpayResponse.razorpay_order_id,
                                razorpayResponse.razorpay_payment_id,
                                razorpayResponse.razorpay_signature
                            );
                            creditsAdded = result.credits_added;
                            newBalance = result.new_balance;
                        }

                        if (user) {
                            if (serviceType === 'lead_finder') {
                                updateCredits(newBalance, user.emailVerifierCredits);
                            } else {
                                updateCredits(user.leadFinderCredits, newBalance);
                            }
                        }

                        setSuccessData({ creditsAdded, newBalance });
                        setState('success');
                    } catch (err) {
                        setErrorMessage(err instanceof Error ? err.message : 'Payment verification failed');
                        setState('error');
                    }
                },
                (failure) => {
                    if (failure.error?.code === 'MODAL_DISMISSED') {
                        setState('idle');
                    } else {
                        setErrorMessage(failure.error?.description ?? 'Payment failed');
                        setState('error');
                    }
                }
            );
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to create order');
            setState('error');
        }
    };

    const selectedPlanDetails = getPlansByServiceType(serviceType).find(p => p.id === selectedPlan);
    const isProcessing = state === 'creating_order' || state === 'checkout_open' || state === 'verifying';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={state === 'idle' ? onClose : undefined} />

            <div className="relative glass-dark rounded-2xl shadow-2xl w-full max-w-lg border border-white/10 z-10">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Buy {serviceName} Credits</h2>
                    {!isProcessing && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Idle: plan selector */}
                    {state === 'idle' && (
                        <>
                            <PricingPlanSelector serviceType={serviceType} selectedPlanId={selectedPlan} onSelect={setSelectedPlan} />
                            <button
                                onClick={handlePay}
                                disabled={!selectedPlan || !isScriptLoaded}
                                className="mt-6 w-full btn-gradient-primary text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {selectedPlanDetails
                                    ? `Pay ${selectedPlanDetails.price_display} for ${selectedPlanDetails.credits.toLocaleString()} ${serviceType === 'email_verifier' ? 'verifications' : 'credits'}`
                                    : 'Select a plan to continue'}
                            </button>
                        </>
                    )}

                    {/* Loading states */}
                    {(state === 'creating_order' || state === 'verifying') && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
                            <p className="text-white font-medium">
                                {state === 'creating_order' ? 'Preparing your order...' : 'Confirming payment...'}
                            </p>
                        </div>
                    )}

                    {state === 'checkout_open' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
                            <p className="text-white font-medium">Complete payment in the Razorpay window</p>
                            <p className="text-sm text-gray-400">Do not close this window</p>
                        </div>
                    )}

                    {/* Success */}
                    {state === 'success' && successData && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                            <CheckCircle2 className="w-14 h-14 text-green-400" />
                            <div>
                                <p className="text-xl font-bold text-white">Payment Successful!</p>
                                <p className="text-gray-400 mt-1">
                                    <span className="text-green-400 font-semibold">+{successData.creditsAdded.toLocaleString()} credits</span> added to {serviceName}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">New balance: {successData.newBalance.toLocaleString()} credits</p>
                            </div>
                            <button onClick={onClose} className="btn-gradient-primary text-white font-semibold py-2 px-8 rounded-xl mt-2">
                                Done
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {state === 'error' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                            <AlertCircle className="w-14 h-14 text-red-400" />
                            <div>
                                <p className="text-xl font-bold text-white">Payment Failed</p>
                                <p className="text-sm text-gray-400 mt-1">{errorMessage}</p>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => { setState('idle'); setErrorMessage(''); }}
                                    className="btn-gradient-primary text-white font-semibold py-2 px-6 rounded-xl"
                                >
                                    Try Again
                                </button>
                                <button onClick={onClose} className="border border-white/20 text-gray-300 font-semibold py-2 px-6 rounded-xl hover:border-white/40 transition">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
