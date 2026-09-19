import http from 'k6/http';
import { check } from 'k6';

export const options = {
    scenarios: {
        frontend_page_load: {
            executor: 'constant-arrival-rate',
            rate: 7000,
            timeUnit: '1s',
            duration: '10m',
            preAllocatedVUs: 100,
            maxVUs: 5000,
        },
    },
};

const BASE_URL = 'https://otryadkovpaka.org';

export default function () {
    const res = http.get(`${BASE_URL}/`, {
        responseType: 'none',
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
    });
}