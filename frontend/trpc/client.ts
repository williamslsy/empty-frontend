import { createLocalTRPCLink, ContextOptions } from "./index";
import { appRouter, AppRouter } from "./routers";
import { createTRPCReact, getFetch, httpBatchLink, loggerLink, splitLink } from "@trpc/react-query";

export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME) return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCReact<AppRouter>();

export const createClient = (ctx: ContextOptions) =>
  trpc.createClient({
    links: [
      loggerLink({
        enabled: () => true,
      }),
      splitLink({
        condition: (op) => {
          return op.path.startsWith("local");
        },
        true: createLocalTRPCLink({ router: appRouter, ...ctx }),
        false: httpBatchLink({
          url: `${getBaseUrl()}/api/trpc/`,
          fetch: async (input, init?) => {
            const fetch = getFetch();
            return fetch(input, {
              ...init,
              credentials: "include",
            });
          },
        }),
      }),
    ],
  });
