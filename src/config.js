// Valores por defecto: 60 req/minuto, coste 1 token
module.exports = {
  REFILL_TOKENS: parseInt(process.env.REFILL_TOKENS) || 60,
  REFILL_PERIOD: parseInt(process.env.REFILL_PERIOD) || 60, 
  COST_PER_REQUEST: 1
};
