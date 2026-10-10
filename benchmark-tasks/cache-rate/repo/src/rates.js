// fetchRate(currency) -> Promise<number>; `now` is injectable for testing.
export async function getExchangeRate(currency, fetchRate, now = Date.now) {
  return fetchRate(currency);
}
