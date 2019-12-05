import PnpmError from '@pnpm/error';
export default class UnexpectedVirtualStoreDirError extends PnpmError {
    expected: string;
    actual: string;
    modulesDir: string;
    constructor(opts: {
        expected: string;
        actual: string;
        modulesDir: string;
    });
}
