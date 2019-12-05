export declare type AuditVulnerabilityCounts = {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
};
export declare type AuditResolution = {
    id: number;
    path: string;
    dev: boolean;
    optional: boolean;
    bundled: boolean;
};
export declare type AuditAction = {
    action: string;
    module: string;
    target: string;
    isMajor: boolean;
    resolves: Array<AuditResolution>;
};
export declare type AuditAdvisory = {
    findings: [{
        version: string;
        paths: Array<string>;
        dev: boolean;
        optional: boolean;
        bundled: boolean;
    }];
    id: number;
    created: string;
    updated: string;
    deleted?: boolean;
    title: string;
    found_by: {
        name: string;
    };
    reported_by: {
        name: string;
    };
    module_name: string;
    cves: Array<string>;
    vulnerable_versions: string;
    patched_versions: string;
    overview: string;
    recommendation: string;
    references: string;
    access: string;
    severity: string;
    cwe: string;
    metadata: {
        module_type: string;
        exploitability: number;
        affected_components: string;
    };
    url: string;
};
export declare type AuditMetadata = {
    vulnerabilities: AuditVulnerabilityCounts;
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    totalDependencies: number;
};
export declare type AuditReport = {
    actions: Array<AuditAction>;
    advisories: {
        [id: string]: AuditAdvisory;
    };
    muted: Array<Object>;
    metadata: AuditMetadata;
};
export declare type AuditActionRecommendation = {
    cmd: string;
    isBreaking: boolean;
    action: AuditAction;
};
