function calculateTax(subtotal, rate = 18.00) {
  const subTotalNum = parseFloat(subtotal) || 0;
  const taxRate = parseFloat(rate) / 100;
  const taxAmount = parseFloat((subTotalNum * taxRate).toFixed(2));
  const totalAmount = parseFloat((subTotalNum + taxAmount).toFixed(2));
  return {
    subtotal: parseFloat(subTotalNum.toFixed(2)),
    taxRate: parseFloat(rate),
    taxAmount,
    totalAmount
  };
}

module.exports = calculateTax;
