export interface LocalPackageSpec {
    dependencyPath: string;
    fetchSpec: string;
    id: string;
    type: 'directory' | 'file';
    normalizedPref: string;
}
export default function parsePref(pref: string, importerDir: string, lockfileDir: string): LocalPackageSpec | null;
