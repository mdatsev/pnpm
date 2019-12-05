declare const _default: () => {
    git: (resolution: {
        repo: string;
        commit: string;
    }, targetFolder: string) => Promise<{
        filesIndex: any;
        tempLocation: string;
    }>;
};
export default _default;
