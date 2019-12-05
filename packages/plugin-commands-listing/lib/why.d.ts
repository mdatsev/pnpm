import { handler as list } from './list';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare const handler: typeof list;
