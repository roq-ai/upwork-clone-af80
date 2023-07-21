import type { NextApiRequest, NextApiResponse } from 'next';
import { roqClient } from 'server/roq';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';
import { getServerSession, useSession } from '@roq/nextjs';
const session = useSession;
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  // console.log('curre', { roqUserId, user });

  switch (req.method) {
    case 'POST':
      const body = { ...req.body };
      // console.log('body', body);
      await roqClient.asUser(body.applicantId).createConversation({
        conversation: {
          title: body.jobTitle,
          ownerId: body.applicantId,
          memberIds: [body.applicantId, body.userId],
          isGroup: true,
          tags: ['hackathon'],
        },
      });
      // console.log("response", response);
      return res.status(201).json({ message: 'Chat Created' });

    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
}
