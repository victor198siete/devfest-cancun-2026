#!/usr/bin/env bash
# Arranca Metro y precalienta los bundles de iOS y Android para que el primer teléfono no espere.
set -u
npx expo start --port "$PORT" &
METRO=$!
listo() { node -e "fetch('http://localhost:$PORT/status').then(r=>r.text()).then(t=>process.exit(t.includes('running')?0:1)).catch(()=>process.exit(1))"; }
for i in $(seq 1 120); do listo && break; sleep 1; done
for p in ios android; do
  node -e "fetch('http://localhost:$PORT/src/main.ts.bundle?platform=$p&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=src%2Fapp').then(r=>r.text()).then(t=>console.log('precalentado $p',t.length)).catch(e=>console.log('precalentado $p falló',e.message))" &
done
wait $METRO
