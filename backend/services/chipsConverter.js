// central conversion between various input currencies and unified "chips"
// rates can be adjusted or pulled from config/market data later

const rates = {
  USDT: 1,     // 1 USDT == 1 chip
  ZELO: 0.5,   // example rate: 2 chips per ZELO
  ETH: 2000,   // 1 ETH -> 2000 chips (just illustrative value)
  BTC: 30000,  // 1 BTC -> 30000 chips
  // other currencies default to zero (unsupported)
};

function toChips(amount, currency) {
  if (!amount || amount <= 0) return 0;
  const rate = rates[currency] || 0;
  return amount * rate;
}

function fromChips(chips, currency) {
  const rate = rates[currency] || 1;
  return chips / rate;
}

module.exports = {
  toChips,
  fromChips,
  rates // export for inspection or admin UI
};