export declare type HostedPackageSpec = ({
    fetchSpec: string;
    hosted?: {
        type: string;
        user: string;
        project: string;
        committish: string;
        tarball(): string | void;
    };
    normalizedPref: string;
    gitCommittish: string | null;
    gitRange?: string;
});
export default function parsePref(pref: string): Promise<HostedPackageSpec | null>;
