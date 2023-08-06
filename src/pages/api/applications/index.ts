import type { NextApiRequest, NextApiResponse } from 'next';
import { roqClient } from 'server/roq';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';
import { applicationValidationSchema } from 'validationSchema/applications';
import { convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';
import 'dotenv/config'
import { Platform } from '@roq/nodejs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  switch (req.method) {
    case 'GET':
      return getApplications();
    case 'POST':
      return createApplication();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  async function getApplications() {
    const data = await prisma.application
      .withAuthorization({
        roqUserId,
        tenantId: user.tenantId,
        roles: user.roles,
      })
      .findMany({ ...convertQueryToPrismaUtil(req.query, 'application'), orderBy: { created_at: 'desc' } });
    
    return res.status(200).json(data);
  }

  async function createApplication() {
    await applicationValidationSchema.validate(req.body);
    const body = { ...req.body };

    const job = await prisma.job.findFirst({ where: { id: body.job_id }, include: { company: true } });
    const companyUsers = await roqClient.asSuperAdmin().users({ filter: { tenantId: { equalTo: job.company.tenant_id } } });
    const usersId = companyUsers.users.data.map((user) => user.id);
    
    const conversationId = await roqClient.asUser(roqUserId).createConversation({
      conversation: {
        title: job.title,
        ownerId: roqUserId,
        memberIds: [roqUserId, ...usersId],
        isGroup: true,
      },
    });
    // console.log('userID',usersId)

    await roqClient.asSuperAdmin().notify({
      notification: {
        key: 'applications',
        recipients: {
          userIds: [...usersId],
        },
        // data: [
        //   { key: 'title', value: job.title },
        //   // { key: 'jobUrl', value: `/jobs/view/${job.id}` },
        // ],
      },
    });

    const data = await prisma.application.create({
      data: { ...body, roqConversationId: conversationId.createConversation.id },
    });

    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
}
