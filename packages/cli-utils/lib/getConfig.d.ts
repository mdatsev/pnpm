export default function (cliArgs: object, opts: {
    excludeReporter: boolean;
    command: string[];
}): Promise<import("@pnpm/config").Config>;
