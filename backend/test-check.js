import prisma from './src/prisma/index.js';

(async () => {
  const reqs = await prisma.disposalRequest.findMany({ where: { disposalCode: 'DSP-2569-001' } });
  console.log(reqs.map(r => ({ id: r.id, status: r.status })));
})();
