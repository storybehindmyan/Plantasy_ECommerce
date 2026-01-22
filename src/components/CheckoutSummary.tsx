/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { ShoppingBag, MapPin } from "lucide-react";
import type { CartItem } from "../context/CartContext";

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  deliveryAddress?: any;
  pricing?: any;
  deliveryCharge?: number;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  deliveryAddress,
  pricing,
  deliveryCharge = 0,
}) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = pricing?.tax || 0;
  const discount = pricing?.discount || 0;
  const total = subtotal + tax + deliveryCharge - discount;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md sticky top-32">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Summary</h2>

      {/* Items */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={20} className="text-[#c16e41]" />
          <h3 className="font-semibold text-gray-800">
            Items ({cartItems.length})
          </h3>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-gray-600"
            >
              <span>
                {item.name} x {item.quantity}
              </span>
              <span className="font-medium">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {deliveryAddress && (
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-[#c16e41]" />
            <h3 className="font-semibold text-gray-800">Delivery To</h3>
          </div>
          <p className="text-sm text-gray-600">
            {deliveryAddress.firstName} {deliveryAddress.lastName}
            <br />
            {deliveryAddress.addressLine1}
            <br />
            {deliveryAddress.addressLine2 && (
              <>
                {deliveryAddress.addressLine2}
                <br />
              </>
            )}
            {deliveryAddress.city}, {deliveryAddress.region}{" "}
            {deliveryAddress.zip}
            <br />
            {deliveryAddress.country}
          </p>
        </div>
      )}

      {/* Pricing */}
      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
        )}

        {deliveryCharge > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Delivery Charge</span>
            <span>₹{deliveryCharge.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t">
          <span>Total</span>
          <span className="text-[#c16e41]">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
