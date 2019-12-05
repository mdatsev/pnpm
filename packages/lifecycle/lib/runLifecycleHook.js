"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const lifecycle = require("@zkochan/npm-lifecycle");
function noop() { } // tslint:disable-line:no-empty
async function runLifecycleHook(stage, manifest, opts) {
    var _a, _b;
    const optional = opts.optional === true;
    if (opts.stdio !== 'inherit') {
        core_loggers_1.lifecycleLogger.debug({
            depPath: opts.depPath,
            optional,
            script: manifest.scripts[stage],
            stage,
            wd: opts.pkgRoot,
        });
    }
    const m = { _id: getId(manifest), ...manifest };
    m.scripts = { ...m.scripts };
    if (stage === 'start' && !m.scripts.start) {
        m.scripts.start = 'node server.js';
    }
    if (((_a = opts.args) === null || _a === void 0 ? void 0 : _a.length) && ((_b = m.scripts) === null || _b === void 0 ? void 0 : _b[stage])) {
        m.scripts[stage] = `${m.scripts[stage]} ${opts.args.map((arg) => `"${arg}"`).join(' ')}`;
    }
    return lifecycle(m, stage, opts.pkgRoot, {
        config: opts.rawConfig,
        dir: opts.rootNodeModulesDir,
        extraBinPaths: opts.extraBinPaths || [],
        log: {
            clearProgress: noop,
            info: noop,
            level: opts.stdio === 'inherit' ? undefined : 'silent',
            pause: noop,
            resume: noop,
            showProgress: noop,
            silly: npmLog,
            verbose: npmLog,
            warn: noop,
        },
        runConcurrently: true,
        stdio: opts.stdio || 'pipe',
        unsafePerm: opts.unsafePerm,
    });
    function npmLog(prefix, logid, stdtype, line) {
        switch (stdtype) {
            case 'stdout':
            case 'stderr':
                core_loggers_1.lifecycleLogger.debug({
                    depPath: opts.depPath,
                    line: line.toString(),
                    stage,
                    stdio: stdtype,
                    wd: opts.pkgRoot,
                });
                return;
            case 'Returned: code:':
                if (opts.stdio === 'inherit') {
                    // Preventing the pnpm reporter from overriding the project's script output
                    return;
                }
                const code = arguments[3];
                core_loggers_1.lifecycleLogger.debug({
                    depPath: opts.depPath,
                    exitCode: code,
                    optional,
                    stage,
                    wd: opts.pkgRoot,
                });
                return;
        }
    }
}
exports.default = runLifecycleHook;
function getId(manifest) {
    return `${manifest.name || ''}@${manifest.version || ''}`;
}
