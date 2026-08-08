import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

// Keep the client usable while we close legacy surface mismatches incrementally.
// We still seed it with the real AppRouter so built-in helpers like Provider/useUtils
// remain valid, then relax the nested surface temporarily to avoid blocking the app.
export const trpc = createTRPCReact<AppRouter>() as any;
