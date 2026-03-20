import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  getUser: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
