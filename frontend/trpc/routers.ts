import { createTRPCRouter, createCallerFactory, createTRPCPublicProcedure } from "./index";
import { userRouter } from "./routers/user";
import { poolsRouter } from "./routers/pools";
import { assetsRouter } from "./routers/assets";

export const edgeRouter = createTRPCRouter({
  user: userRouter,
  health: createTRPCPublicProcedure.query(async () => {
    return { status: "up" };
  }),
});

const localRouter = createTRPCRouter({
  pools: poolsRouter,
  assets: assetsRouter,
});

export const appRouter = createTRPCRouter({
  edge: edgeRouter,
  local: localRouter,
});

export type AppRouter = typeof appRouter;

export const callerFactory = createCallerFactory(appRouter);
