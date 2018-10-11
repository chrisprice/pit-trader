import leftPad from 'left-pad';

const currencyFormatter = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' });

export const currency = (value, padding = 12) =>
  leftPad(currencyFormatter.format(value), padding);
