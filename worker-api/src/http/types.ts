import type { AuthenticatedUser } from "../auth/middleware";
import type { AppEnv } from "../config";

interface AppVariables {
  requestId: string;
  authenticated: AuthenticatedUser;
}

export interface AppBindings {
  Bindings: AppEnv;
  Variables: AppVariables;
}
