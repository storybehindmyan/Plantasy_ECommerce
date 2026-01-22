import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const AddressService = {
  async saveAddress(
    userId: string,
    address: {
      firstName: string;
      lastName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      region: string;
      zip: string;
      country: string;
    }
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        addresses: [address], // or append to existing
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving address:", error);
      throw error;
    }
  },
};
