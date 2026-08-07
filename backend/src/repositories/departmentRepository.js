import prisma from '../prisma/index.js';

export const findAll = async () => {
  return await prisma.department.findMany({ orderBy: { name: 'asc' } });
};

export const findById = async (id) => {
  return await prisma.department.findUnique({ where: { id: Number(id) } });
};

export const create = async (data) => {
  return await prisma.department.create({ data });
};

export const update = async (id, data) => {
  return await prisma.department.update({ where: { id: Number(id) }, data });
};

export const remove = async (id) => {
  return await prisma.department.delete({ where: { id: Number(id) } });
};