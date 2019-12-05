import PnpmError from '@pnpm/error';
export default class UnexpectedStoreError extends PnpmError {
    expectedStorePath: string;
    actualStorePath: string;
    modulesDir: string;
    constructor(opts: {
        expectedStorePath: string;
        actualStorePath: string;
        modulesDir: string;
    });
}
