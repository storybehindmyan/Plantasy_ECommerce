import React from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  status: "idle" | "pending" | "success" | "failed"; // ✅ Add "idle" here
  orderId?: string;
  message?: string;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  status,
  orderId,
  message,
  onClose,
}) => {
  if (!isOpen || status === "idle") return null; // ✅ Don't render if idle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {status === "pending" && (
          <>
            <div className="flex justify-center mb-4">
              <Loader className="animate-spin text-[#c16e41]" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Processing Payment...
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we process your payment
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-green-600">
              Payment Successful!
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Your order has been confirmed.
            </p>
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-xl font-bold text-gray-800">{orderId}</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-[#c16e41] text-white font-bold rounded-lg hover:bg-[#a05a32] transition-colors"
            >
              Continue Shopping
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="text-red-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-red-600">
              Payment Failed
            </h2>
            <p className="text-gray-600 text-center mb-4">
              {message || "Your payment could not be processed. Please try again."}
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-[#c16e41] text-white font-bold rounded-lg hover:bg-[#a05a32] transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
