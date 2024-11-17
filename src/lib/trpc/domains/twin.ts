import { isAdmin } from '../middlewares/auth';
import { t } from '../t';
import { z } from 'zod';
import { TwinPostBuilder } from '$lib/server/twin/builder';
import { prismaClient } from '$lib/server/prisma/client';

export const generateTwinIssue = t.procedure
  .use(isAdmin)
  .input((input: unknown) => {
    return z.object({ issue: z.number(), days: z.number().optional().default(7) }).parse(input);
  })
  .mutation(async ({ input: { issue, days } }) => {
    const twinBuilder = new TwinPostBuilder();
    await twinBuilder.validate(issue);
    return await twinBuilder.run(issue, days);
  });

export const updateTwinIssue = t.procedure
  .use(isAdmin)
  .input((input: unknown) => {
    return z.object({ issue: z.number(), title: z.string(), content: z.string() }).parse(input);
  })
  .mutation(async ({ input: { issue, title, content } }) => {
    return await prismaClient.twinPost.update({
      where: { issue },
      data: {
        content: content,
        title: title
      }
    });
  });

export const publishTwinIssue = t.procedure
  .use(isAdmin)
  .input((input: unknown) => {
    return z.object({ issue: z.number() }).parse(input);
  })
  .mutation(async ({ input: { issue } }) => {
    return await prismaClient.twinPost.update({
      where: { issue },
      data: {
        publishedAt: new Date()
      }
    });
  });

export const getLatestTwinIssue = t.procedure.query(async () => {
  return await prismaClient.twinPost.findFirst({
    select: {
      publishedAt: true,
      title: true,
      issue: true,
      content: false
    },
    where: {
      publishedAt: {
        not: null
      }
    },
    orderBy: {
      publishedAt: 'desc'
    }
  });
});
