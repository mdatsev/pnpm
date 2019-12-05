"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_commands_audit_1 = require("@pnpm/plugin-commands-audit");
const plugin_commands_import_1 = require("@pnpm/plugin-commands-import");
const plugin_commands_installation_1 = require("@pnpm/plugin-commands-installation");
const plugin_commands_listing_1 = require("@pnpm/plugin-commands-listing");
const plugin_commands_outdated_1 = require("@pnpm/plugin-commands-outdated");
const plugin_commands_publishing_1 = require("@pnpm/plugin-commands-publishing");
const plugin_commands_recursive_1 = require("@pnpm/plugin-commands-recursive");
const plugin_commands_script_runners_1 = require("@pnpm/plugin-commands-script-runners");
const help_1 = require("./help");
const installTest = require("./installTest");
const prune = require("./prune");
const rebuild = require("./rebuild");
const root = require("./root");
const server = require("./server");
const store = require("./store");
const commands = [
    plugin_commands_installation_1.add,
    plugin_commands_audit_1.audit,
    plugin_commands_import_1.importCommand,
    plugin_commands_installation_1.install,
    installTest,
    plugin_commands_installation_1.link,
    plugin_commands_listing_1.list,
    plugin_commands_outdated_1.outdated,
    plugin_commands_publishing_1.pack,
    prune,
    plugin_commands_publishing_1.publish,
    rebuild,
    plugin_commands_recursive_1.recursive,
    plugin_commands_installation_1.remove,
    plugin_commands_script_runners_1.restart,
    root,
    plugin_commands_script_runners_1.run,
    server,
    plugin_commands_script_runners_1.start,
    plugin_commands_script_runners_1.stop,
    store,
    plugin_commands_script_runners_1.test,
    plugin_commands_installation_1.unlink,
    plugin_commands_installation_1.update,
    plugin_commands_listing_1.why,
];
const handlerByCommandName = {};
const helpByCommandName = {};
const typesByCommandName = {};
const aliasToFullName = new Map();
for (let i = 0; i < commands.length; i++) {
    const { commandNames, handler, help, types } = commands[i];
    if (!commandNames || commandNames.length === 0) {
        throw new Error('The command at index ' + i + " doesn't have command names");
    }
    for (const commandName of commandNames) {
        handlerByCommandName[commandName] = handler;
        helpByCommandName[commandName] = help;
        typesByCommandName[commandName] = types;
    }
    if (commandNames.length > 1) {
        const fullName = commandNames[0];
        for (let i = 1; i < commandNames.length; i++) {
            aliasToFullName.set(commandNames[i], fullName);
        }
    }
}
handlerByCommandName.help = help_1.default(helpByCommandName);
exports.default = handlerByCommandName;
function getTypes(commandName) {
    var _a, _b;
    return ((_b = (_a = typesByCommandName)[commandName]) === null || _b === void 0 ? void 0 : _b.call(_a)) || {};
}
exports.getTypes = getTypes;
function getCommandFullName(commandName) {
    return aliasToFullName.get(commandName) || commandName;
}
exports.getCommandFullName = getCommandFullName;
