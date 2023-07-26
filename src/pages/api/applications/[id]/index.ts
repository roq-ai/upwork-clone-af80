import type { NextApiRequest, NextApiResponse } from 'next';
import { roqClient } from 'server/roq';
import { prisma } from 'server/db';
import { errorHandlerMiddleware } from 'server/middlewares';
import { applicationValidationSchema } from 'validationSchema/applications';
import { HttpMethod, convertMethodToOperation, convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';
import companies from 'pages/companies';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  await prisma.application
    .withAuthorization({
      roqUserId,
      tenantId: user.tenantId,
      roles: user.roles,
    })
    .hasAccess(req.query.id as string, convertMethodToOperation(req.method as HttpMethod));

  switch (req.method) {
    case 'GET':
      return getApplicationById();
    case 'PUT':
      return updateApplicationById();
    case 'DELETE':
      return deleteApplicationById();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
  async function getApplicationById() {
    const data = await prisma.application.findFirst(convertQueryToPrismaUtil(req.query, 'application'));
    return res.status(200).json(data);
  }

  async function updateApplicationById() {
    await applicationValidationSchema.validate(req.body);
    const data = await prisma.application.update({
      where: { id: req.query.id as string },
      data: {
        ...req.body,
      },
    });
    const job = await prisma.job.findFirst({ where: { id: data.job_id } });
    const user = await prisma.user.findFirst({ where: { id: data.user_id } });
    const company = await prisma.company.findFirst({ where: { id: job.company_id } });
    if (data.status === 'Hired') {
      await roqClient.asSuperAdmin().notify({
        notification: {
          key: 'hiring',
          recipients: {
            userIds: [user.roq_user_id],
          },
          data: [
            { key: 'jobTitle', value: job.title },
            { key: 'company', value: company.name },
            { key: 'jobUrl', value: `/jobs/view/${job.id}` },
          ],
        },
      });
    }
    if (data.status === 'Rejected') {
      await roqClient.asSuperAdmin().notify({
        notification: {
          key: 'rejection',
          recipients: {
            userIds: [user.roq_user_id],
          },
          data: [
            { key: 'jobTitle', value: job.title },
            { key: 'company', value: company.name },
            { key: 'jobUrl', value: `/jobs/view/${job.id}` },
          ],
        },
      });
    }
    return res.status(200).json(data);
  }
  async function deleteApplicationById() {
    const data = await prisma.application.delete({
      where: { id: req.query.id as string },
    });
    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(handler)(req, res);
}
