export interface PackageSelector {
    pattern: string;
    scope: 'exact' | 'dependencies' | 'dependents';
    selectBy: 'name' | 'location';
}
declare const _default: (rawSelector: string, prefix: string) => PackageSelector;
export default _default;
