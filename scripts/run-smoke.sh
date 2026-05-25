#!/usr/bin/env bash
set -euo pipefail

sleep 3
username="smoketest.$(date +%s)"
password='TestPass123!'

echo '--- hr health ---'
curl -sS --max-time 5 http://localhost:8085/actuator/health || echo 'health-check-failed'
echo
echo '--- auth health ---'
curl -sS --max-time 5 http://localhost:8086/actuator/health || echo 'auth-health-failed'
echo
echo "--- register ${username} ---"
curl -sS -i -X POST http://localhost:8086/xac-thuc/dang-ky -H "Content-Type: application/json" -d "{\"username\":\"${username}\",\"password\":\"${password}\",\"role\":\"USER\"}" -m 15 || echo 'register-failed'
echo
echo "--- login ${username} ---"
curl -sS -i -X POST http://localhost:8086/xac-thuc/dang-nhap -H "Content-Type: application/json" -d "{\"username\":\"${username}\",\"password\":\"${password}\"}" -m 15 || echo 'login-failed'
echo
echo done
