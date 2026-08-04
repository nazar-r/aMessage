import http from 'k6/http';
import { check } from 'k6';

export const options = {
    scenarios: {
        create_80_users: {
            executor: 'shared-iterations',
            vus: 25,
            iterations: 45,
            maxDuration: '1m',
        },
    },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
    const uid = `${Date.now()}-${__VU}-${__ITER}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = JSON.stringify({
        userId: `test-${uid}`,
        userEmail: `test-${uid}@example.com`,
        userName: `Mykola Parasuk ${uid}`,
    });

    const res = http.post(`${BASE_URL}/auth/test/register`, payload, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    check(res, {
        'status is 200/201': (r) => r.status === 200 || r.status === 201,
        'access token returned': (r) => !!r.json('access_token'),
    });
}

// import { Body, Controller, Post } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthUser } from '../src.extensions/extensions.types/auth.types';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) { }

//   @Post('test/register')
//   async testRegister(
//     @Body()
//     body: {
//       userId: string;
//       userEmail: string;
//       userName: string;
//     },
//   ) {
//     const profile = {
//       userId: body.userId,
//       userEmail: body.userEmail,
//       userName: body. userName ?? 'Test User',
//     } as AuthUser;

//     return this.authService.signUser(profile);
//   }
// }