import prisma from '../prisma/index.js';

export const findAll = async () => {
  return await prisma.location.findMany({ orderBy: [{ building: 'asc' }, { name: 'asc' }] });
};

export const findById = async (id) => {
  return await prisma.location.findUnique({ where: { id: Number(id) } });
};

export const create = async (data) => {
  return await prisma.location.create({ data });
};

export const update = async (id, data) => {
  return await prisma.location.update({ where: { id: Number(id) }, data });
};

export const remove = async (id) => {
  return await prisma.location.delete({ where: { id: Number(id) } });
};