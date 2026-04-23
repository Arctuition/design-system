// Supabase edge-runtime main service router
// Mounted at /root/index.ts inside the edge runtime Docker container.
// Generated to work around supabase functions serve bug in CLI v2.75.0.
// See .claude/decisions.md #4 and .claude/local-dev.md for context.

import { STATUS_CODE, STATUS_TEXT } from "https://deno.land/std/http/status.ts";
import * as posix from "https://deno.land/std/path/posix/mod.ts";
import * as jose from "https://deno.land/x/jose@v4.13.1/index.ts";

const SB_SPECIFIC_ERROR_CODE = {
  BootError: STATUS_CODE.ServiceUnavailable,
  InvalidWorkerResponse: STATUS_CODE.InternalServerError,
  WorkerLimit: 546,
};
const SB_SPECIFIC_ERROR_TEXT = {
  [SB_SPECIFIC_ERROR_CODE.BootError]: "BOOT_ERROR",
  [SB_SPECIFIC_ERROR_CODE.InvalidWorkerResponse]: "WORKER_ERROR",
  [SB_SPECIFIC_ERROR_CODE.WorkerLimit]: "WORKER_LIMIT",
};
const SB_SPECIFIC_ERROR_REASON = {
  [SB_SPECIFIC_ERROR_CODE.BootError]: "Worker failed to boot (please check logs)",
  [SB_SPECIFIC_ERROR_CODE.InvalidWorkerResponse]: "Function exited due to an error (please check logs)",
  [SB_SPECIFIC_ERROR_CODE.WorkerLimit]: "Worker failed to respond due to a resource limit (please check logs)",
};
const EXCLUDED_ENVS = ["HOME", "HOSTNAME", "PATH", "PWD"];
const JWT_SECRET = Deno.env.get("SUPABASE_INTERNAL_JWT_SECRET")!;
const HOST_PORT = Deno.env.get("SUPABASE_INTERNAL_HOST_PORT")!;
const DEBUG = Deno.env.get("SUPABASE_INTERNAL_DEBUG") === "true";
const FUNCTIONS_CONFIG_STRING = Deno.env.get("SUPABASE_INTERNAL_FUNCTIONS_CONFIG")!;
const WALLCLOCK_LIMIT_SEC = parseInt(Deno.env.get("SUPABASE_INTERNAL_WALLCLOCK_LIMIT_SEC") ?? "400");
const DENO_SB_ERROR_MAP = new Map([
  [Deno.errors.InvalidWorkerCreation, SB_SPECIFIC_ERROR_CODE.BootError],
  [Deno.errors.InvalidWorkerResponse, SB_SPECIFIC_ERROR_CODE.InvalidWorkerResponse],
  [Deno.errors.WorkerRequestCancelled, SB_SPECIFIC_ERROR_CODE.WorkerLimit],
]);
const GENERIC_FUNCTION_SERVE_MESSAGE = `Serving functions on http://127.0.0.1:${HOST_PORT}/functions/v1/<function-name>`;

interface FunctionConfig {
  entrypointPath: string;
  importMapPath: string;
  verifyJWT: boolean;
}

function getResponse(payload: any, status: number, customHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...customHeaders };
  let body: string | null = null;
  if (payload) {
    if (typeof payload === "object") { headers["Content-Type"] = "application/json"; body = JSON.stringify(payload); }
    else if (typeof payload === "string") { headers["Content-Type"] = "text/plain"; body = payload; }
  }
  return new Response(body, { status, headers });
}

const functionsConfig: Record<string, FunctionConfig> = (() => {
  try {
    const fc = JSON.parse(FUNCTIONS_CONFIG_STRING);
    if (DEBUG) console.log("Functions config:", JSON.stringify(fc, null, 2));
    return fc;
  } catch (cause) { throw new Error("Failed to parse functions config", { cause }); }
})();

function getAuthToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Missing authorization header");
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer") throw new Error(`Auth header is not 'Bearer {token}'`);
  return token;
}

async function verifyJWT(jwt: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);
  try { await jose.jwtVerify(jwt, secretKey); } catch (e) { console.error(e); return false; }
  return true;
}

async function shouldUsePackageJsonDiscovery({ entrypointPath, importMapPath }: FunctionConfig): Promise<boolean> {
  if (importMapPath) return false;
  const packageJsonPath = posix.join(posix.dirname(entrypointPath), "package.json");
  try { await Deno.lstat(packageJsonPath); } catch (err) { if (err instanceof Deno.errors.NotFound) return false; }
  return true;
}

Deno.serve({
  port: 8081,
  handler: async (req: Request) => {
    const url = new URL(req.url);
    const { pathname } = url;
    if (pathname === "/_internal/health") return getResponse({ message: "ok" }, STATUS_CODE.OK);
    if (pathname === "/_internal/metric") {
      const metric = await (EdgeRuntime as any).getRuntimeMetrics();
      return Response.json(metric);
    }
    const pathParts = pathname.split("/");
    const functionName = pathParts[1];
    if (!functionName || !(functionName in functionsConfig)) return getResponse("Function not found", STATUS_CODE.NotFound);
    if (req.method !== "OPTIONS" && functionsConfig[functionName].verifyJWT) {
      try {
        const token = getAuthToken(req);
        const isValidJWT = await verifyJWT(token);
        if (!isValidJWT) return getResponse({ msg: "Invalid JWT" }, STATUS_CODE.Unauthorized);
      } catch (e) { console.error(e); return getResponse({ msg: (e as Error).toString() }, STATUS_CODE.Unauthorized); }
    }
    const servicePath = posix.dirname(functionsConfig[functionName].entrypointPath);
    console.error(`serving the request with ${servicePath}`);
    const memoryLimitMb = 256;
    const workerTimeoutMs = isFinite(WALLCLOCK_LIMIT_SEC) ? WALLCLOCK_LIMIT_SEC * 1000 : 400 * 1000;
    const noModuleCache = false;
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.entries(envVarsObj).filter(([name]) => !EXCLUDED_ENVS.includes(name) && !name.startsWith("SUPABASE_INTERNAL_"));
    const forceCreate = false;
    const customModuleRoot = "";
    const cpuTimeSoftLimitMs = 1000;
    const cpuTimeHardLimitMs = 2000;
    const decoratorType = "tc39";
    const absEntrypoint = posix.join(Deno.cwd(), functionsConfig[functionName].entrypointPath);
    const maybeEntrypoint = posix.toFileUrl(absEntrypoint).href;
    const usePackageJson = await shouldUsePackageJsonDiscovery(functionsConfig[functionName]);
    try {
      const worker = await (EdgeRuntime as any).userWorkers.create({
        servicePath, memoryLimitMb, workerTimeoutMs, noModuleCache,
        noNpm: !usePackageJson, importMapPath: functionsConfig[functionName].importMapPath,
        envVars, forceCreate, customModuleRoot, cpuTimeSoftLimitMs, cpuTimeHardLimitMs,
        decoratorType, maybeEntrypoint, context: { useReadSyncFileAPI: true },
      });
      return await worker.fetch(req);
    } catch (e: any) {
      console.error(e);
      for (const [denoError, sbCode] of DENO_SB_ERROR_MAP.entries()) {
        if (denoError !== void 0 && e instanceof denoError) {
          return getResponse({ code: SB_SPECIFIC_ERROR_TEXT[sbCode], message: SB_SPECIFIC_ERROR_REASON[sbCode] }, sbCode);
        }
      }
      return getResponse({ code: STATUS_TEXT[STATUS_CODE.InternalServerError], message: "Request failed due to an internal server error", trace: JSON.stringify(e.stack) }, STATUS_CODE.InternalServerError);
    }
  },
  onListen: () => {
    try {
      const fc = JSON.parse(FUNCTIONS_CONFIG_STRING) as Record<string, unknown>;
      const functionNames = Object.keys(fc);
      const urls = functionNames.slice(0, 5).map((f) => ` - http://127.0.0.1:${HOST_PORT}/functions/v1/${f}`);
      console.log(`${GENERIC_FUNCTION_SERVE_MESSAGE}${functionNames.length > 0 ? "\n" + urls.join("\n") : ""}\nUsing ${Deno.version.deno}`);
    } catch { console.log(`${GENERIC_FUNCTION_SERVE_MESSAGE}\nUsing ${Deno.version.deno}`); }
  },
  onError: (e: any) => getResponse({ code: STATUS_TEXT[STATUS_CODE.InternalServerError], message: "Request failed due to an internal server error", trace: JSON.stringify(e.stack) }, STATUS_CODE.InternalServerError),
});
