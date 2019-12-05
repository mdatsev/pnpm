export default function safeIsInnerLink(importerModulesDir: string, depName: string, opts: {
    hideAlienModules: boolean;
    importerDir: string;
    storeDir: string;
    virtualStoreDir: string;
}): Promise<true | string>;
