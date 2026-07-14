import { Strategy } from 'passport-jwt';
declare const JwtPassportExtractor_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtPassportExtractor extends JwtPassportExtractor_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
    }>;
}
export {};
