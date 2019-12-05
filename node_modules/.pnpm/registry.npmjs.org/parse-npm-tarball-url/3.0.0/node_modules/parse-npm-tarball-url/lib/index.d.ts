export default function parseNpmTarballUrl(url: string): {
    host: string;
    name: string;
    version: string;
} | null;
