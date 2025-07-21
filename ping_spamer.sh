#!/usr/bin/env bash

# uso: ./ping_spammer.sh <veces> [intervalo]
#   <veces>     número de peticiones a enviar
#   [intervalo] tiempo en segundos a esperar entre peticiones (por defecto 0)

if [[ -z "$1" ]]; then
  echo "Uso: $0 <veces> [intervalo]"
  exit 1
fi

COUNT=$1
INTERVAL=${2:-0}
URL="http://localhost:4000/ping"

echo "Enviando $COUNT peticiones a $URL con intervalo de $INTERVAL s..."

for ((i=1; i<=COUNT; i++)); do
  # -s para silencioso, -o /dev/null descarta cuerpo
  curl -s -o /dev/null -w "[$i/%{url_effective}] %{http_code}\n" "$URL"
  sleep "$INTERVAL"
done

echo "¡Listo!"
