import { ImporterManifest } from '@pnpm/types';
export declare function readJson5File(filePath: string): Promise<{
    data: ImporterManifest;
    text: string;
}>;
export declare function readJsonFile(filePath: string): Promise<{
    data: ImporterManifest;
    text: string;
}>;
