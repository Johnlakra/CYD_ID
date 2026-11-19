export const formatMoney = (paise) => {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toFixed(2)}`;
};

export const rupeesToPaise = (rupees) => Math.round(parseFloat(rupees || 0) * 100);
