import { Strategy } from 'passport-jwt';
declare const JwtExtractor_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtExtractor extends JwtExtractor_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
    }>;
}
export {};
