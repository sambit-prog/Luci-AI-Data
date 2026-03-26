import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ServiceType } from '../../../services/paymentService';
import { PurchaseModal } from './PurchaseModal';

interface CreditBalanceCardProps {
    serviceType: ServiceType;
    serviceName: string;
    balance: number;
    icon: React.ReactNode;
    accentColor: string;
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({
    serviceType,
    serviceName,
    balance,
    icon,
    accentColor,
}) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="glass-dark rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/5`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
                </div>

                <div>
                    <p className="text-4xl font-bold text-white">{balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">credits remaining</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition border-2 ${accentColor}`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Buy Credits
                </button>
            </div>

            {showModal && (
                <PurchaseModal
                    serviceType={serviceType}
                    serviceName={serviceName}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};
