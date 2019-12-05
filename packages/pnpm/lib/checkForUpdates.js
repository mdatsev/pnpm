"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const chalk = require("chalk");
const common_tags_1 = require("common-tags");
const updateNotifier = require("update-notifier");
function default_1() {
    const notifier = updateNotifier({ pkg: cli_utils_1.packageManager });
    const update = notifier.update;
    if (!update) {
        return;
    }
    const message = common_tags_1.stripIndents `
    Update available! ${chalk.red(update.current)} → ${chalk.green(update.latest)}
    ${chalk.magenta('Changelog:')} https://github.com/pnpm/pnpm/releases/tag/v${update.latest}
    Run ${chalk.magenta('pnpm i -g pnpm')} to update!

    Follow ${chalk.magenta('@pnpmjs')} for updates: https://twitter.com/pnpmjs
  `;
    notifier.notify({ message });
}
exports.default = default_1;
