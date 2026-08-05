import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },   // Ramp up to 500 virtual users
    { duration: '1m', target: 2000 },   // Ramp up to 2,000 virtual users
    { duration: '2m', target: 5000 },   // Peak load: 5,000 virtual users
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],   // 95% of requests must complete below 200ms
    http_req_failed: ['rate<0.01'],     // Failed requests must be under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // 1. Health Check Test
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Fetch Missions List Test
  const missionsRes = http.get(`${BASE_URL}/missions?city=DOUALA`);
  check(missionsRes, {
    'missions status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
