import { useEffect, useRef, useState } from 'react';
import { CreateOrderResponse } from '../services/paymentService';

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayFailureResponse {
    error: { code: string; description: string; reason: string };
}

type OnSuccess = (response: RazorpaySuccessResponse) => void;
type OnFailure = (error: RazorpayFailureResponse) => void;

export const useRazorpay = () => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        // Avoid loading the script more than once
        if (document.getElementById('razorpay-checkout-script')) {
            setIsScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-checkout-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        script.onerror = () => console.error('Failed to load Razorpay checkout script');
        document.head.appendChild(script);
        scriptRef.current = script;

        return () => {
            // Don't remove — keep cached for subsequent opens
        };
    }, []);

    const openCheckout = (
        orderData: CreateOrderResponse,
        onSuccess: OnSuccess,
        onFailure: OnFailure
    ) => {
        if (!isScriptLoaded || !(window as any).Razorpay) {
            console.error('Razorpay script not loaded yet');
            return;
        }

        const options = {
            key: orderData.razorpay_key,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.order_id,
            prefill: orderData.prefill,
            theme: { color: '#F25912' },
            handler: (response: RazorpaySuccessResponse) => {
                onSuccess(response);
            },
            modal: {
                ondismiss: () => {
                    onFailure({
                        error: { code: 'MODAL_DISMISSED', description: 'Payment cancelled', reason: 'User closed the payment window' },
                    });
                },
            },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
            onFailure(response);
        });
        rzp.open();
    };

    return { isScriptLoaded, openCheckout };
};
