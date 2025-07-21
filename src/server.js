const express = require("express");
const bodyParser = require("body-parser");
const { redis } = require("./redis");
const { checkRate } = require("./limiter");
const { REFILL_TOKENS, REFILL_PERIOD } = require("./config");

const app = express();
app.use(bodyParser.json());

// Middleware de rate-limit
app.use(async (req, res, next) => {
  const key = req.headers["x-user-id"] || req.ip;
  try {
    const ok = await checkRate(key);
    // Registrar métricas
    await redis.hincrby("stats:total", key, 1);
    if (!ok) {
      await redis.hincrby("stats:blocked", key, 1);
      return res.status(429).json({ error: "Rate limit exceeded" });
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Endpoints
app.get("/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get("/stats", async (req, res, next) => {
  try {
    const total   = await redis.hgetall("stats:total");
    const blocked = await redis.hgetall("stats:blocked");
    // Formatear para JSON
    const buckets = {};
    const allKeys = new Set([...Object.keys(total), ...Object.keys(blocked)]);
    allKeys.forEach(k => {
      buckets[k] = {
        allowed: parseInt(total[k] || "0"),
        blocked: parseInt(blocked[k] || "0")
      };
    });
    res.json({
      total_requests: Object.values(buckets).reduce((a,b)=>a+b.allowed,0),
      blocked_requests: Object.values(buckets).reduce((a,b)=>a+b.blocked,0),
      buckets
    });
  } catch (err) {
    next(err);
  }
});

// Ajustar configuración en caliente
app.post("/config", (req, res) => {
  const { refillTokens, refillPeriod } = req.body;
  if (refillTokens) process.env.REFILL_TOKENS = refillTokens;
  if (refillPeriod) process.env.REFILL_PERIOD = refillPeriod;
  res.json({ status: "updated", refillTokens, refillPeriod });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Arranque
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Rate-Limiter API listening on port ${PORT}`);
});
