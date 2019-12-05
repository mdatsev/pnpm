import { ImporterManifest } from '@pnpm/types';
export default function getPreferredVersionsFromPackage(pkg: Pick<ImporterManifest, 'devDependencies' | 'dependencies' | 'optionalDependencies'>): {
    [packageName: string]: {
        selector: string;
        type: 'version' | 'range' | 'tag';
    };
};
