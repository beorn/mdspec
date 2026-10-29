// src/spawn.ts — runtime-detecting subprocess spawning
// Enables mdspec to work on both Bun and Node.js without external dependencies.

const isBun = typeof Bun !== "undefined"

/** Portable sleep — replaces Bun.sleep() */
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// ============ Pipe-based spawning (CmdSession, bun.ts shell adapter) ============

/** Writable stream abstraction for subprocess stdin */
export interface SpawnStdin {
  write(data: string | Uint8Array): void
  end(): void
  flush?(): void
}

/** Spawned process handle returned by spawnProcess() */
export interface SpawnedProcess {
  stdin: SpawnStdin
  stdout: ReadableStream<Uint8Array> | NodeJS.ReadableStream
  stderr: ReadableStream<Uint8Array> | NodeJS.ReadableStream
  pid: number
  exitCode: number | null
  kill(signal?: number): void
  exited: Promise<number>
}

/**
 * Spawn a subprocess with piped stdin/stdout/stderr.
 * Uses Bun.spawn on Bun, child_process.spawn on Node.js.
 */
export function spawnProcess(
  cmd: string[],
  opts: {
    env?: Record<string, string | undefined>
    cwd?: string
  },
): SpawnedProcess {
  if (isBun) {
    const proc = Bun.spawn(cmd, {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      cwd: opts.cwd,
      env: opts.env,
    })
    return {
      stdin: {
        write: (d) => void proc.stdin.write(d),
        end: () => void proc.stdin.end(),
        flush: () => void proc.stdin.flush(),
      },
      stdout: proc.stdout,
      stderr: proc.stderr,
      get exitCode() {
        return proc.exitCode
      },
      pid: proc.pid,
      kill: (s) => proc.kill(s),
      exited: proc.exited,
    }
  }

  // Node.js fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require("node:child_process") as typeof import("node:child_process")
  const child = spawn(cmd[0]!, cmd.slice(1), {
    env: opts.env,
    cwd: opts.cwd,
    stdio: ["pipe", "pipe", "pipe"],
  })

  // Convert Node.js streams to ReadableStream for consistent API
  return {
    stdin: {
      write: (d) => child.stdin!.write(d),
      end: () => child.stdin!.end(),
    },
    stdout: child.stdout!,
    stderr: child.stderr!,
    get exitCode() {
      return child.exitCode
    },
    pid: child.pid!,
    kill: (s) => child.kill(s),
    exited: new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 1))),
  }
}

// ============ Shell execution (for bun.ts integration + bash plugin) ============

import type { ShellResult, ShellOptions } from "./shell.js"

/**
 * Execute a command and collect stdout/stderr with timeout.
 * Portable replacement for bunShell — works on both Bun and Node.js.
 */
export async function portableShell(cmd: string[], opts?: ShellOptions): Promise<ShellResult> {
  const timeout = opts?.timeout ?? 30000

  if (isBun) {
    // Bun path: use Bun.spawn + ReadableStream
    const baseEnv = opts?.env ?? (process.env as Record<string, string>)
    const proc = Bun.spawn(cmd, {
      cwd: opts?.cwd ?? process.cwd(),
      env: { ...baseEnv, TERM: "dumb" },
      stdout: "pipe",
      stderr: "pipe",
    })

    const processPromise = (async () => {
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      return { stdout: Buffer.from(stdout), stderr: Buffer.from(stderr), exitCode }
    })()

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), timeout)
    })

    try {
      return await Promise.race([processPromise, timeoutPromise])
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "TIMEOUT") {
        proc.kill()
        return {
          stdout: Buffer.from(""),
          stderr: Buffer.from(`Command timed out after ${timeout}ms`),
          exitCode: 124,
        }
      }
      throw err
    }
  }

  // Node.js path: use child_process.spawn
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require("node:child_process") as typeof import("node:child_process")
  const baseEnv = opts?.env ?? (process.env as Record<string, string>)

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0]!, cmd.slice(1), {
      cwd: opts?.cwd ?? process.cwd(),
      env: { ...baseEnv, TERM: "dumb" },
      stdio: ["ignore", "pipe", "pipe"],
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    proc.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk))
    proc.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk))

    const timer = setTimeout(() => {
      proc.kill()
      resolve({
        stdout: Buffer.from(""),
        stderr: Buffer.from(`Command timed out after ${timeout}ms`),
        exitCode: 124,
      })
    }, timeout)

    proc.on("close", (exitCode) => {
      clearTimeout(timer)
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks),
        exitCode: exitCode ?? 0,
      })
    })

    proc.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}
