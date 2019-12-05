declare type ImportFile = (src: string, dest: string) => Promise<void>;
export default function importIndexedDir(importFile: ImportFile, existingDir: string, newDir: string, filenames: string[]): Promise<void>;
export {};
