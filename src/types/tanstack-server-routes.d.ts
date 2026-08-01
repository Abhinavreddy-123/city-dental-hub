// Ensures the `server` route option (server route handlers) is typed even when
// multiple @tanstack/router-core copies are resolved in node_modules.
declare module "@tanstack/router-core" {
  interface FilebaseRouteOptionsInterface {
    server?: {
      middleware?: ReadonlyArray<unknown>;
      handlers?: unknown;
    };
  }
}

export {};