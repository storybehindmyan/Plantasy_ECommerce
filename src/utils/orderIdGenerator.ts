export const generateOrderId = (): string => {
  const randomEightDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `OD${String(randomEightDigits).padStart(8, "0")}`;
};
