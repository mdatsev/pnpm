export interface RegistryPackageSpec {
    type: 'tag' | 'version' | 'range';
    name: string;
    fetchSpec: string;
    normalizedPref?: string;
}
export default function parsePref(pref: string, alias: string | undefined, defaultTag: string, registry: string): RegistryPackageSpec | null;
