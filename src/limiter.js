const { redis, getLuaSha } = require("./redis");
const { REFILL_TOKENS, REFILL_PERIOD, COST_PER_REQUEST } = require("./config");

async function checkRate(key) {
  const sha = getLuaSha();
  if (!sha) throw new Error("Lua script aún no cargado");
  // Ejecuta el script con EVALSHA
  const allowed = await redis.evalsha(
    sha,
    0,
    key,
    REFILL_TOKENS,
    REFILL_PERIOD,
    COST_PER_REQUEST
  );
  return allowed === 1;
}

module.exports = { checkRate };
