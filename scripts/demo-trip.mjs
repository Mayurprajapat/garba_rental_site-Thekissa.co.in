// Live demo: yahan se agent-GPS publish hota hai, customer link par dot live hilta hai.
// Usage: node scripts/demo-trip.mjs links  -> demo URLs print karo
//        node scripts/demo-trip.mjs go     -> 2-min live trip publish karo
import mqtt from 'mqtt';

const TOPIC = 'thekissa/garba/DEMO01';
const BASE = 'https://garba-rental-website-phi.vercel.app';
const STORE = { lat: 22.7196, lng: 75.8577 };
const DEST = { lat: 22.748, lng: 75.893 };

const snap = {
  code: 'DEMO01', customer: 'Demo Customer', phone: '9876543210', address: 'Vijay Nagar, Indore',
  destLat: DEST.lat, destLng: DEST.lng, agent: 'Demo Rider', agentPhone: '',
  status: 'onway', agentLat: STORE.lat, agentLng: STORE.lng,
  updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
};

const b64 = Buffer.from(JSON.stringify(snap), 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Browser decode jaisa round-trip check
const back = JSON.parse(Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

if (process.argv[2] === 'links') {
  console.log('roundtrip ok:', back.code === 'DEMO01' && back.destLat === DEST.lat);
  console.log('CUSTOMER: ' + BASE + '/t/DEMO01#s=' + b64);
  console.log('AGENT: ' + BASE + '/d/DEMO01#s=' + b64);
  process.exit(0);
}

const client = await new Promise((resolve, reject) => {
  const c = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', { connectTimeout: 10000, reconnectPeriod: 0 });
  const to = setTimeout(() => reject(new Error('connect timeout')), 12000);
  c.once('connect', () => { clearTimeout(to); resolve(c); });
  c.once('error', (e) => { clearTimeout(to); reject(e); });
});
console.log('agent online — publishing live GPS');

const pub = (lat, lng, status) => client.publish(
  TOPIC, JSON.stringify({ lat, lng, status, ts: new Date().toISOString() }), { retain: true },
);

pub(STORE.lat, STORE.lng, 'onway');
console.log('ping 0/12 (store)');
const STEPS = 12;
for (let i = 1; i <= STEPS; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const lat = STORE.lat + ((DEST.lat - STORE.lat) * i) / STEPS;
  const lng = STORE.lng + ((DEST.lng - STORE.lng) * i) / STEPS;
  const done = i === STEPS;
  pub(lat, lng, done ? 'delivered' : 'onway');
  console.log(`ping ${i}/${STEPS}` + (done ? ' (delivered)' : ''));
}
client.end();
console.log('TRIP COMPLETE');
