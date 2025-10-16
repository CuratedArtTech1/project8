export const currency = (n: number): string =>
  (isNaN(Number(n)) ? 0 : Number(n)).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

export const daysBetween = (a: string, b: string): number => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const inDays = (date: string): number =>
  Math.floor((new Date(date).getTime() - new Date(todayISO()).getTime()) / (1000 * 60 * 60 * 24));

export const download = (filename: string, text: string): void => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
