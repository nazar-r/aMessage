import http from 'k6/http';
import { check } from 'k6';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnZ2xfMTE3NDA2MDA1MTk1MzgzMTAwNjgwIiwiaWF0IjoxNzgyNzU5MzE5LCJleHAiOjE3ODI4ODg5MTl9.Qyl7HdIglyL4HEY1xJn5wEJOa2X_Aa5PNzYEE2Hxn-4';

export const options = {
  scenarios: {
    constant_rps: {
      executor: 'constant-arrival-rate',
      rate: 10500,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 4000,
      maxVUs: 5000,
    },
  },
};

export default function () {
  const res = http.get('http://localhost:3001/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  const rps = data.metrics.http_reqs.values.rate;
  const avgLatency = data.metrics.http_req_duration.values.avg;
  const p95Latency = data.metrics.http_req_duration.values['p(95)'];
  const failed = data.metrics.http_req_failed.values.rate * 100;
  const dropped = data.metrics.dropped_iterations?.values?.count ?? 0;

  return {
    output: `
     ==================================================
                   PERFORMANCE SUMMARY
     ==================================================
    🟢 Avg. RPS            : ${rps.toFixed(2)}
    🔵 Avg. Latency        : ${avgLatency.toFixed(2)}ms
    🔵 P95 Latency         : ${p95Latency.toFixed(2)}ms
    🔴 Failed Requests     : ${failed.toFixed(2)}%
    🟠 Failed VU's Itr.    : ${dropped}
    ===================================================
    `,
  };
}