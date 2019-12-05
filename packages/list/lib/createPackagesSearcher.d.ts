export default function createPatternSearcher(queries: string[]): (pkg: {
    name: string;
    version: string;
}) => boolean;
