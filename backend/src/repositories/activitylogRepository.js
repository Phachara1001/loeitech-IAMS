import prisma from '../prisma/index.js';

export const findAll = async () => {
  return await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, username: true } }
    }
  });
};