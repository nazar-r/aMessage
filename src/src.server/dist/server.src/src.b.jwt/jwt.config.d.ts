import { Strategy } from 'passport-jwt';
declare const JwtConfig_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtConfig extends JwtConfig_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
        name: any;
    }>;
}
export {};
