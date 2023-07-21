import type { NextApiRequest, NextApiResponse } from 'next';
import { roqClient } from 'server/roq';
import { prisma } from 'server/db';
import { errorHandlerMiddleware } from 'server/middlewares';
import { jobValidationSchema } from 'validationSchema/jobs';
import { HttpMethod, convertMethodToOperation, convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  await prisma.job
    .withAuthorization({
      roqUserId,
      tenantId: user.tenantId,
      roles: user.roles,
    })
    .hasAccess(req.query.id as string, convertMethodToOperation(req.method as HttpMethod));

  switch (req.method) {
    case 'GET':
      return getJobById();
    case 'PUT':
      return updateJobById();
    case 'DELETE':
      return deleteJobById();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  async function getJobById() {
    const data = await prisma.job.findFirst(convertQueryToPrismaUtil(req.query, 'job'));
    
    // for(const i in data.application){
    //   const user_id = data.application[i].user_id
    //   const user = await prisma.user.findFirst({where:{id:user_id}});
    //   data.application[i].user = user;
    // }
    // console.log("application fa", data.application.user);

    return res.status(200).json(data);
  }

  async function updateJobById() {
    await jobValidationSchema.validate(req.body);
    const data = await prisma.job.update({
      where: { id: req.query.id as string },
      data: {
        ...req.body,
      },
    });

    return res.status(200).json(data);
  }
  async function deleteJobById() {
    const data = await prisma.job.delete({
      where: { id: req.query.id as string },
    });
    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(handler)(req, res);
}
