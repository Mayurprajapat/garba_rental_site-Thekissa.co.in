import mqtt from 'mqtt';

const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const TOPIC = 'thekissa/garba/LIVETEST01';

async function tryBroker(url) {
  return new Promise((resolve) => {
    const c = mqtt.connect(url, { connectTimeout: 8000, reconnectPeriod: 0 });
    const to = setTimeout(() => { try { c.end(true); } catch {} resolve(null); }, 10000);
    c.once('connect', () => {
      clearTimeout(to);
      c.subscribe(TOPIC, () => {
        c.publish(TOPIC, JSON.stringify({ lat: 22.72, lng: 75.85, status: 'onway', ts: new Date().toISOString() }), { retain: true });
      });
    });
    c.on('message', (t, m) => {
      if (t === TOPIC) {
        clearTimeout(to);
        console.log('RECEIVED via', url, ':', m.toString());
        try { c.end(true); } catch {}
        resolve(url);
      }
    });
    c.once('error', () => { clearTimeout(to); try { c.end(true); } catch {} resolve(null); });
  });
}

for (const b of BROKERS) {
  const ok = await tryBroker(b);
  if (ok) { console.log('LIVE TRACKING WORKS via', ok); process.exit(0); }
  console.log('broker failed:', b);
}
console.log('NO BROKER REACHABLE');
process.exit(1);
