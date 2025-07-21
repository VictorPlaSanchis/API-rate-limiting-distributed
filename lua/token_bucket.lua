-- ARGV[1]: key (IP o X-User-ID)
-- ARGV[2]: refill tokens por periodo
-- ARGV[3]: periodo en segundos
-- ARGV[4]: tokens requeridos por petición (1)
local key       = ARGV[1]
local refill    = tonumber(ARGV[2])
local period    = tonumber(ARGV[3])
local cost      = tonumber(ARGV[4])

-- Claves auxiliares
local ts_key    = key .. ":ts"
local token_key = key .. ":tokens"

-- Leer estado actual
local last_ts   = tonumber(redis.call("GET", ts_key) or "0")
local tokens    = tonumber(redis.call("GET", token_key) or tostring(refill))

-- Calcular tokens a añadir
local now       = tonumber(redis.call("TIME")[1])
local delta     = math.max(0, now - last_ts)
local add       = math.floor(delta * (refill / period))
tokens = math.min(refill, tokens + add)
last_ts = now

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

-- Guardar nuevo estado
redis.call("SET", ts_key, last_ts)
redis.call("SET", token_key, tokens)

return allowed
