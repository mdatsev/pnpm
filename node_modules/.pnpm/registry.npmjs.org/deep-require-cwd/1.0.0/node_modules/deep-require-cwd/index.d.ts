export = deepRequireCwd;

declare function deepRequireCwd (moduleIds: string[]): any;

declare namespace deepRequireCwd {
  export function silent (moduleIds: string[]): any;
}
