import prisma from './src/prisma/index.js';

async function main() {
  const requests = await prisma.disposalRequest.findMany({
    orderBy: { createdAt: 'asc' },
    select: { disposalCode: true },
    distinct: ['disposalCode']
  });
  console.log('Found codes:', requests.map(r => r.disposalCode));
  
  let counter = 1;
  for (const r of requests) {
    const parts = r.disposalCode.split('-');
    const newCode = `DSP-${parts[1]}-${String(counter).padStart(3, '0')}`;
    if (newCode !== r.disposalCode) {
      console.log(`Updating ${r.disposalCode} to ${newCode}`);
      await prisma.disposalRequest.updateMany({
        where: { disposalCode: r.disposalCode },
        data: { disposalCode: newCode }
      });
    }
    counter++;
  }
  console.log('Fixed disposal codes!');
  process.exit(0);
}

main().catch(console.error);
