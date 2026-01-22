/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { toast } from "sonner";
import { DelhiveryService } from "../services/DelhiveryService";
import { CheckCircle, AlertCircle } from "lucide-react";

interface AddressFormProps {
  onAddressSubmit: (address: any) => void;
  isLoading?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  onAddressSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    zip: "",
    country: "India",
  });

  const [verifyingDelivery, setVerifyingDelivery] = useState(false);
  const [deliveryVerified, setDeliveryVerified] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset delivery verification when zip changes
    if (name === "zip") {
      setDeliveryVerified(false);
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.region ||
      !formData.zip
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate phone
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // Verify delivery availability
    setVerifyingDelivery(true);
    try {
      const isAvailable = await DelhiveryService.verifyDeliveryAvailability(
        formData.zip
      );

      if (isAvailable) {
        setDeliveryVerified(true);
        toast.success("Delivery available for this location!");
      } else {
        setDeliveryVerified(false);
        toast.error(
          "Delivery not available for this pin code. Please try another address."
        );
      }
    } catch (error) {
      console.error("Error verifying delivery:", error);
      toast.error("Error verifying delivery. Please try again.");
    } finally {
      setVerifyingDelivery(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryVerified) {
      toast.error("Please verify delivery availability first");
      return;
    }

    onAddressSubmit(formData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Delivery Address</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="10-digit phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
            required
          />
        </div>

        {/* Address Line 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleInputChange}
            placeholder="Flat No, Building Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
            required
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleInputChange}
            placeholder="Road name, Area"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
          />
        </div>

        {/* City, Region, Zip */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Region *
            </label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code *
            </label>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              placeholder="6-digit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c16e41] outline-none"
              required
            />
          </div>
        </div>

        {/* Delivery Verification Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deliveryVerified ? (
                <>
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-green-600 font-medium">
                    Delivery Available
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-amber-600" size={20} />
                  <span className="text-amber-600 font-medium">
                    Verify Delivery Availability
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyDelivery}
              disabled={verifyingDelivery || isLoading}
              className="px-4 py-2 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] disabled:opacity-50 transition-colors"
            >
              {verifyingDelivery ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!deliveryVerified || isLoading}
          className="w-full px-6 py-3 bg-[#c16e41] text-white font-bold rounded-lg hover:bg-[#a05a32] disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Processing..." : "Continue to Payment"}
        </button>
      </form>
    </div>
  );
};

export default AddressForm;
