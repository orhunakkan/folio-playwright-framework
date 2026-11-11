// Runs the Playwright CLI in the pinned image (src/config/image.ts): `node scripts/playwright.ts test --grep @smoke`.
// `npm test` and `npm run test:ui` use it. Every machine and CI then run the same Node, browsers, fonts and system
// libraries, so a run behaves and looks the same everywhere. CI's jobs already run in the image, so there it starts
// Playwright directly.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { IMAGE } from '../src/config/image.ts';

const PLAYWRIGHT = 'node_modules/.bin/playwright';
// Passed by name only, so no value appears in a command line. Locally the secrets aren't in the environment at
// all: the run reads them from .env, which is in the mounted checkout.
const PASSED_ENV = [
  'DEV_BASIC_USER',
  'DEV_BASIC_PASS',
  'FOLIO_TEST_API_TOKEN',
  'CI',
  'FAKER_SEED',
  'PERFORMANCE',
  'AGENTS',
];
// UI mode is served from the container to the host's browser, on this port of localhost only.
const UI_PORT = '9324';

const args = process.argv.slice(2);
// The official image sets this, and nothing else does.
const inImage = process.env.PLAYWRIGHT_BROWSERS_PATH === '/ms-playwright';

process.exitCode = await (inImage ? run(PLAYWRIGHT, args) : run('docker', dockerArgs()));

function dockerArgs(): string[] {
  // The checkout is mounted at the same path, so file paths in errors and the report match the host's.
  const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
  const docker = ['run', '--rm', '--init', '--ipc=host', '--volume', `${root}:${root}`, '--workdir', root];
  if (process.stdin.isTTY && process.stdout.isTTY) docker.push('--interactive', '--tty');
  // The test agents' MCP server talks over stdin and stdout, which are pipes, not a terminal.
  else if (args[0] === 'run-test-mcp-server') docker.push('--interactive');
  // Files the run writes (the report, test results) belong to you, not to root. HOME must then be writable.
  if (process.getuid && process.getgid) {
    docker.push('--user', `${String(process.getuid())}:${String(process.getgid())}`, '--env', 'HOME=/tmp');
  }
  for (const name of PASSED_ENV) if (process.env[name] !== undefined) docker.push('--env', name);

  const playwrightArgs = [...args];
  if (args.includes('--ui')) {
    docker.push('--publish', `127.0.0.1:${UI_PORT}:${UI_PORT}`);
    playwrightArgs.push('--ui-host=0.0.0.0', `--ui-port=${UI_PORT}`);
    console.log(`UI mode: open http://localhost:${UI_PORT} once it is listening.`);
  }
  return [...docker, IMAGE, PLAYWRIGHT, ...playwrightArgs];
}

function run(command: string, commandArgs: string[]): Promise<number> {
  // Ctrl-C reaches the child as well; let it stop Playwright cleanly and pass on the exit code.
  process.on('SIGINT', () => undefined);
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, { stdio: 'inherit' });
    child.on('error', (error: NodeJS.ErrnoException) => {
      console.error(
        error.code === 'ENOENT' && command === 'docker'
          ? 'Docker is not installed or not on PATH. Tests run in the pinned Playwright image: see README.md.'
          : error.message,
      );
      resolve(1);
    });
    child.on('exit', (code, signal) => {
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}
