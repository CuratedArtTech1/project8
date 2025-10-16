export const toUSD = (cents: number | null | undefined): number => {
  return (cents ?? 0) / 100;
};

export const usdStr = (cents: number | null | undefined): string => {
  return toUSD(cents).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export const fromUSD = (value: string | number): number => {
  return Math.round(Number(value || 0) * 100);
};

export const pctLabel = (bps: number | null | undefined): string => {
  return `${(Number(bps || 0) / 100).toFixed(2)}%`;
};

export const bpsToDecimal = (bps: number | null | undefined): number => {
  return Number(bps || 0) / 10000;
};

export const decimalToBps = (decimal: number): number => {
  return Math.round(decimal * 10000);
};
