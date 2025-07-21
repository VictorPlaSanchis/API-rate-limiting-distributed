const Redis = require("ioredis");
const path  = require("path");
const fs    = require("fs");

const redis = new Redis();  // Ajusta URL/credenciales si es necesario

// cargar script Lua y guardar SHA
const lua = fs.readFileSync(path.join(__dirname, "../lua/token_bucket.lua"));
let sha;
redis.script("LOAD", lua).then(res => { sha = res; });

module.exports = {
  redis,
  getLuaSha: () => sha
};
