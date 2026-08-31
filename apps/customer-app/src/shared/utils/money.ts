export const formatMoney = (value: number) => {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};
