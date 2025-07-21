const express    = require("express");
const cors       = require("cors");
const bodyParser = require("body-parser");
const { redis }  = require("./redis");
const { checkRate } = require("./limiter");

const app = express();

// dashboard (other project in github called: API-rate-limiter-dashboard) needs cors
app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json()); // for db flush

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

// Necesita bodyParser para JSON
// POST /admin/flush
app.post("/admin/flush", async (_, res, next) => {
  try {
    // vacía la db actual
    await redis.flushdb();
    res.json({ status: "ok", msg: "DB flushed" });
  } catch (err) {
    next(err);
  }
});

// POST /admin/spam
// { count, intervalMs }
app.post("/admin/spam", async (req, res, _) => {
  const { count, intervalMs } = req.body;
  const c = parseInt(count) || 0;
  const delay = parseInt(intervalMs) || 0;

  // dispara las peticiones en background
  (async () => {
    for (let i = 0; i < c; i++) {
      try { await redis.call("PING"); } catch(_) {}
      await new Promise(r => setTimeout(r, delay));
    }
  })();

  res.json({ status: "started", count: c, intervalMs: delay });
});