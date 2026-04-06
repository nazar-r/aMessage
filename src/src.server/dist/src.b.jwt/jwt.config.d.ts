import { Strategy } from 'passport-jwt';
declare const JwtConfig_base: new (...args: any[]) => Strategy;
export declare class JwtConfig extends JwtConfig_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
        name: any;
    }>;
}
export {};
