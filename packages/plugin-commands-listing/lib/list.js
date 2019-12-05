"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const list_1 = require("@pnpm/list");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
function types() {
    return R.pick([
        'depth',
        'dev',
        'global-dir',
        'global',
        'json',
        'long',
        'only',
        'optional',
        'parseable',
        'production',
        'recursive',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['list', 'ls', 'la', 'll'];
function help() {
    return renderHelp({
        aliases: ['list', 'ls', 'la', 'll'],
        description: common_tags_1.oneLine `When run as ll or la, it shows extended information by default.
      All dependencies are printed by default. Search by patterns is supported.
      For example: pnpm ls babel-* eslint-*`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `Perform command on every package in subdirectories
              or on every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Show extended information',
                        name: '--long',
                    },
                    {
                        description: 'Show parseable output instead of tree view',
                        name: '--parseable',
                    },
                    {
                        description: 'Show information in JSON format',
                        name: '--json',
                    },
                    {
                        description: 'List packages in the global install prefix instead of in the current project',
                        name: '--global',
                        shortAlias: '-g',
                    },
                    {
                        description: 'Max display depth of the dependency tree',
                        name: '--depth <number>',
                    },
                    {
                        description: 'Display only direct dependencies',
                        name: '--depth 0',
                    },
                    {
                        description: 'Display only projects. Useful in a monorepo. \`pnpm ls -r --depth -1\` lists all projects in a monorepo',
                        name: '--depth -1',
                    },
                    {
                        description: 'Display only the dependency tree for packages in \`dependencies\`',
                        name: '--prod, --production',
                    },
                    {
                        description: 'Display only the dependency tree for packages in \`devDependencies\`',
                        name: '--dev',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('list'),
        usages: [
            'pnpm ls [<pkg> ...]',
        ],
    });
}
exports.help = help;
function handler(args, opts, command) {
    return render([opts.dir], args, {
        ...opts,
        lockfileDir: opts.lockfileDir || opts.dir,
    }, command);
}
exports.handler = handler;
async function render(prefixes, args, opts, command) {
    const isWhy = command === 'why';
    if (isWhy && !args.length) {
        throw new error_1.default('MISSING_PACKAGE_NAME', '`pnpm why` requires the package name');
    }
    opts.long = opts.long || command === 'll' || command === 'la';
    const listOpts = {
        alwaysPrintRootPackage: opts.alwaysPrintRootPackage,
        depth: isWhy ? Infinity : opts.depth || 0,
        include: opts.include,
        lockfileDir: opts.lockfileDir,
        long: opts.long,
        // tslint:disable-next-line: no-unnecessary-type-assertion
        reportAs: (opts.parseable ? 'parseable' : (opts.json ? 'json' : 'tree')),
    };
    return isWhy || args.length
        ? list_1.forPackages(args, prefixes, listOpts)
        : list_1.default(prefixes, listOpts);
}
exports.render = render;
