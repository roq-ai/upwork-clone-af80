import { getServerSession } from '@roq/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  if (req.method == 'GET') {
    const data = await prisma.job.findMany({
      where: {
        OR: [
          {
            description: {
              contains: req.query.q as string,
              mode: 'insensitive',
            },
          },
          {
            title: {
              contains: req.query.q as string,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
    return res.status(200).json(data);
  }
}

// export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
//   return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
// }
