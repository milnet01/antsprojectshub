// Which TCP port the private stats server listens on.
//
// Precedence: PORT → STATS_PORT → 4321.
//
// PORT is the handle an external process manager uses. It can drop a `PORT=` line into a
// systemd drop-in without editing this repo's packaged unit, and it wins over the unit's own
// STATS_PORT, so the two compose instead of fighting.
//
// A PORT that can't be honoured is fatal, never a silent fallback: something asked for a
// specific port for a reason, and quietly serving 4321 instead is how a dashboard ends up
// "running fine" on a port nobody is pointed at. STATS_PORT keeps its historical lenient
// behaviour on purpose — an unusable value there still falls back to 4321, exactly as it has
// since the unit was written.

export const DEFAULT_PORT = 4321;
export const MIN_PORT = 1024;
export const MAX_PORT = 65535;

/** Resolve the listen port from an environment. Throws if PORT is set but unusable. */
export function resolvePort(env = process.env) {
  const raw = env.PORT;
  if (raw === undefined || raw === "") return Number(env.STATS_PORT) || DEFAULT_PORT;

  // Check the digits themselves rather than trusting Number(): it reads " 12 " as 12 and
  // "0x10" as 16, and neither is what someone writing a port number meant.
  const port = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(port >= MIN_PORT && port <= MAX_PORT)) {
    throw new RangeError(
      `PORT='${raw}' is not a usable port — expected a whole number ` +
        `between ${MIN_PORT} and ${MAX_PORT}. ` +
        `Unset PORT to fall back to STATS_PORT (or ${DEFAULT_PORT}).`,
    );
  }
  return port;
}
