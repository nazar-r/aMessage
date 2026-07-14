import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnZ2xfMTE3NDA2MDA1MTk1MzgzMTAwNjgwIiwiaWF0IjoxNzgzNzk0MDE0LCJleHAiOjE3ODM5MjM2MTR9.bzfhehXYio7cs8-Il2i4HA9B5M3jgcW3aGwQJkgxgvc';
const wsConnectDuration = new Trend('ws_connect_duration');
const wsConnected = new Counter('ws_connected');
const wsFailed = new Counter('ws_failed');

export const options = {
  scenarios: {
    websocket_5000: {
      executor: 'constant-vus',
      vus: 12000,
      duration: '1m',
    },
  },
};


export default function () {
  const start = Date.now();
  const response = ws.connect(
    `ws://localhost:3001/socket.io/?EIO=4&transport=websocket`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    (socket) => {
      socket.on('open', () => {
        wsConnectDuration.add(Date.now() - start);
        wsConnected.add(1);
      });

      socket.on('error', () => {
        wsFailed.add(1);
      });
      sleep(60);
      socket.close();

    },
  );


  check(response, {
    'WS connected': (r) => r && r.status === 101,
  });

}


export function handleSummary(data) {
  const metrics = data.metrics;
  const connections =metrics.ws_connected?.values?.count ?? 0;
  const failed =  metrics.ws_failed?.values?.count ?? 0;
  const avg =metrics.ws_connect_duration?.values?.avg ?? 0;
  const p95 = metrics.ws_connect_duration?.values?.['p(95)'] ?? 0;
  const received =metrics.data_received?.values?.count ?? 0;
  const sent = metrics.data_sent?.values?.count ?? 0;
  return {
    stdout: `
==================================================
              WEBSOCKET TEST RESULTS
==================================================
     🟢 Successful connections : ${connections}
     🔴 Failed connections     : ${failed}

     🔵 Avg connect time       : ${avg.toFixed(2)} ms
     🔵 P95 connect time       : ${p95.toFixed(2)} ms

     📥 Data received          : ${received}
     📤 Data sent              : ${sent}
     👥 Max VUs                : ${data.metrics.vus_max.values.max}

==================================================
`,
  };
}