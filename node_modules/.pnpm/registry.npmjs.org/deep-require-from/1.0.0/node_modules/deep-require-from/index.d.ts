export = deepRequireFrom;

declare function deepRequireFrom (fromDir: string, moduleIds: string[]): any;

declare namespace deepRequireFrom {
  export function silent (fromDir: string, moduleIds: string[]): any;
}
