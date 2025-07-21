# API Rate Limiting con Redis + Lua

Este proyecto implementa un microservicio de rate‑limiting distribuido usando **Node.js**, **Express** y **Redis** con un script **Lua** para garantizar la atomicidad del algoritmo **Token Bucket**.

---

## 📦 Estructura

API-rate-limiting-redis-lua/  
├── lua/  
│   └── token_bucket.lua       # Script Lua para el token bucket  
├── src/  
│   ├── config.js              # Configuración de tokens y periodos  
│   ├── limiter.js             # Ejecuta el script Lua en Redis  
│   ├── redis.js               # Conexión a Redis y carga del script  
│   └── server.js              # Servidor Express y rutas  
├── package.json  
└── README.md                  # <- Tú estás aquí  

---

## 🚀 Cómo arrancar

### Prerrequisitos

- Node.js (v14+)  
- Redis (local o en Docker)

### 1. Clona el repositorio

git clone https://github.com/VictorPlaSanchis/API-rate-limiting-redis-lua.git  
cd API-rate-limiting-redis-lua  

### 2. Arranca Redis

Con Docker:  
docker run -d --name redis -p 6379:6379 redis:latest  

O localmente:  
# macOS (Homebrew)  
brew install redis && brew services start redis  

# Ubuntu/Debian  
sudo apt update  
sudo apt install redis-server  
sudo systemctl enable --now redis-server  

### 3. Instala dependencias y arranca la API

npm install  
npm start  

Por defecto, el servidor escucha en http://localhost:4000.

---

## 📋 Endpoints

- GET /ping  
  Protegido por el rate‑limiter. Devuelve 200 OK o 429 Too Many Requests.

- GET /stats  
  Devuelve estadísticas:  
  {  
    "total_requests": 123,  
    "blocked_requests": 4,  
    "buckets": {  
      "IP_O_USER": { "allowed": 100, "blocked": 4 },  
      ...  
    }  
  }

- POST /config  
  Ajusta dinámicamente los límites:  
  { "refillTokens": 100, "refillPeriod": 60 }

- POST /admin/flush  
  Vacia la base de datos Redis (todos los contadores).

---

## ⚙️ Cómo funciona

1. Token Bucket:  
   El script lua/token_bucket.lua recarga tokens en cada clave (IP o X-User-ID) de forma atómica.

2. Contadores en Redis:  
   Usamos HINCRBY para llevar totales de peticiones y bloqueos.

3. CORS:  
   Configurado en Express para permitir un dashboard en http://localhost:5173 si lo tienes.

---

## 🛠️ Personalización

- Ajusta el rate‑limit modificando las variables de entorno:  
  export REFILL_TOKENS=120     # tokens por periodo  
  export REFILL_PERIOD=60      # periodo en segundos  

- El script Lua se puede tunear para un Sliding Window cambiando la lógica de recarga.

---

## 📥 Descarga el README

Este archivo ya está generado como README.md en tu proyecto.
