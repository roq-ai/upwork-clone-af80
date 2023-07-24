import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
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
