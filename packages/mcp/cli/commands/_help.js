/**
 * Help and serve: the usage text command and the STDIO/HTTP/SSE server entry.
 *
 * The server, both transports, the skill catalog and the installer are
 * imported inside `serveCommand` rather than at the top of the file. They are
 * the whole 185 ms import graph, and `--help`, `--version` and `config` used
 * to pay for it because they share this module - measured by
 * `pnpm report:startup`.
 */

import { renderHelpText } from "../_help-text.js";
import { commandHelp, listAgentCommands } from "../../core/agents/commands/index.js";
import { entrypoint, print } from "./_shared.js";

/**
 * `rule-mcp help [command]`.
 *
 * Bare, it prints the whole guide. With an argument it prints that command's own
 * usage: a slash command's block (the same text `/rule-<command> help` prints, and
 * the same text the Pi extension and opencode plugin embed), or a CLI command's
 * `--help` output.
 *
 * @param {string} [target]
 * @param {import("commander").Command} program
 */
function helpCommand(target, program) {
  if (!target) {
    print(renderHelpText(program));

    return;
  }

  if (listAgentCommands().some((command) => command.name === target)) {
    print(commandHelp(target));

    return;
  }

  const cli = program.commands.find((command) => command.name() === target);

  if (cli) {
    print(cli.helpInformation().trimEnd());

    return;
  }

  throw new Error(`Unknown command "${target}". Run \`rule-mcp help\` for the command list.`);
}

/**
 * The serve subcommand: start the MCP server over the chosen transport.
 *
 * @param {object} [opts]
 */
async function serveCommand(opts = {}) {
  const { loadAllSkills } = await import("../../core/skills/index.js");
  const { mcpServerConfig } = await import("../install/index.js");
  const { startHttpServer, startSseServer } = await import("../../transport/index.js");
  const { startServer } = await import("../../server/index.js");

  await loadAllSkills();
  // Warm the durable tool-result cache on the same startup path as the catalog:
  // left to the first call it reads and gunzips the file synchronously on the
  // request path, once per process - which for a stdio server is once per client.
  const { ensureLoaded } = await import("../../core/cache/tool-cache/index.js");

  ensureLoaded();
  const transport = opts.transport ?? "stdio";

  if (transport === "sse" || transport === "http") {
    const scheme = opts.sslCert && opts.sslKey ? "https" : "http";
    // Port/host resolution (explicit --port > RULE_MCP_PORT > canonical default)
    // is centralized in the transport module so CLI, daemon, and Docker all agree.
    // "http" = Streamable HTTP (current spec); "sse" = HTTP+SSE (back-compat).
    const start = transport === "http" ? startHttpServer : startSseServer;
    const endpoint = transport === "http" ? "mcp" : "sse";
    const { port, host } = await start({
      port: opts.port,
      sslCert: opts.sslCert,
      sslKey: opts.sslKey,
    });
    // Advertise a connectable host: 0.0.0.0 means "all interfaces", so clients use loopback.
    const connectHost = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
    const configSnippet = JSON.stringify(
      {
        mcpServers: mcpServerConfig(entrypoint, { mode: "daemon", port }),
      },
      null,
      2,
    );
    console.error(`\nrule-mcp ${transport === "http" ? "Streamable HTTP" : "SSE"} server listening on ${scheme}://${connectHost}:${port}/${endpoint}\n`);
    console.error(`Config for agent's mcp.json:\n`);
    console.error(configSnippet);
    console.error(``);
    console.error(`Then start an agent configured for HTTP/SSE.`);
    console.error(``);
    // The daemon runs until it is told to stop, and the signal is what tells
    // it: the wait ends when the cleanups the transport registered have run, so
    // sessions, sockets and buffered metrics are closed before the exit rather
    // than dropped by it.
    const { installSignalHandlers, registerCleanup, whenShutdown } = await import("../../core/session/lifecycle/index.js");
    const { startIdleReclaim, stopIdleReclaim } = await import("../../core/session/_reclaim.js");

    registerCleanup("idle-reclaim", () => stopIdleReclaim());
    installSignalHandlers();
    startIdleReclaim();
    // Printed AFTER the handlers exist: "listening" only says the socket is
    // open, and a signal delivered between those two moments killed the
    // process with Node's default disposition instead of the graceful path.
    console.error("rule-mcp ready (signal handlers installed)");
    await whenShutdown();
  } else {
    const configSnippet = JSON.stringify(
      {
        mcpServers: mcpServerConfig(entrypoint),
      },
      null,
      2,
    );

    console.error(`rule-mcp starting (STDIO transport)`);
    console.error(`Config for agent's mcp.json:\n`);
    console.error(configSnippet);
    console.error(``);
    console.error(`Add to agent config, then agent spawns this process.`);
    console.error(`To test: run tools from another terminal with:`);
    console.error(`  echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node ${process.argv[1]} serve`);
    console.error(``);
    await startServer();
  }
}

/**
 * Manage the MCP daemon process and native platform services.
 *
 * Sub-commands:
 *   start|stop|status|logs  - Process-based daemon (no reboot persistence)
 *   install|uninstall       - Platform-native service (LaunchAgent / systemd / Win Service)
 *   enable|disable          - Load/unload the native service without removing it
 *
 * Platform-native services (install):
 *   macOS:   LaunchAgent plist -> appears in System Settings -> General -> Login Items
 *   Linux:   systemd user service -> systemctl --user
 *   Windows: Windows Service -> sc.exe
 *
 * @param {{ action: string, dryRun?: boolean }} opts
 */

export { helpCommand, serveCommand };
