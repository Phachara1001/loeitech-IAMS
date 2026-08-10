import prisma from '../prisma/index.js';

export const findAll = async () => {
  return await prisma.assetDistribution.findMany({
    include: {
      asset: {
        select: {
          id: true,
          seq: true,
          name: true
        }
      },
      responsiblePerson: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { assignDate: 'desc' }
  });
};

export const create = async (data) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Set all current distributions for this asset to isCurrent = false and returnDate = now
    await tx.assetDistribution.updateMany({
      where: {
        assetId: Number(data.assetId),
        isCurrent: true
      },
      data: {
        isCurrent: false,
        returnDate: new Date()
      }
    });

    // 2. Create the new distribution record
    return await tx.assetDistribution.create({
      data: {
        assetId: Number(data.assetId),
        department: data.department,
        building: data.building,
        room: data.room,
        responsiblePersonId: Number(data.responsiblePersonId),
        note: data.note,
        assignDate: data.assignDate ? new Date(data.assignDate) : new Date(),
        isCurrent: true
      },
      include: {
        asset: true,
        responsiblePerson: true
      }
    });
  });
};
