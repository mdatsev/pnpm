import PnpmError from '@pnpm/error';
export default class BadTarballError extends PnpmError {
    expectedSize: number;
    receivedSize: number;
    constructor(opts: {
        expectedSize: number;
        receivedSize: number;
        tarballUrl: string;
    });
}
