import { check } from 'k6';
import http from 'k6/http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnZ2xfMTE3NDA2MDA1MTk1MzgzMTAwNjgwIiwiaWF0IjoxNzg2ODg4MzAzLCJleHAiOjE3ODcwMTc5MDN9.K8V_CbnegS2WpV2zia2qzAR-GHMBhCibpCl3VAq23Ik';
export const options = {
  scenarios: {
    constant_rps: {
      executor: 'constant-arrival-rate',
      rate: 9100,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 1200,
      maxVUs: 4200,
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

// export function handleSummary(data) {
//   const rps = data.metrics.http_reqs.values.rate;
//   const avgLatency = data.metrics.http_req_duration.values.avg;
//   const p95Latency = data.metrics.http_req_duration.values['p(95)'];
//   const failed = data.metrics.http_req_failed.values.rate * 100;
//   const dropped = data.metrics.dropped_iterations?.values?.count ?? 0;
//   // console.log(JSON.stringify(data.metrics, null, 2));

//   return {
//     stdout: `
//      ==================================================
//                    PERFORMANCE SUMMARY
//      ==================================================
//           🟢 Avg. RPS            : ${rps.toFixed(2)}
//           🔵 Avg. Latency        : ${avgLatency.toFixed(2)}ms
//           🔵 P95 Latency         : ${p95Latency.toFixed(2)}ms
//           🔴 Failed Requests     : ${failed.toFixed(2)}%
//           🟠 Skipped VU's Itr.    : ${dropped}
//     ===================================================
//     `,
//   };
// }

export function handleSummary(data) {
  console.log(JSON.stringify(data.metrics, null, 2));
}