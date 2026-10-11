import { getJSON } from './api.js';

export async function getPrice(sku) {
  const data = await getJSON(`https://pricing.internal/skus/${sku}`);
  return data.price;
}
