import { approveRequestBatch } from './src/services/disposalService.js';

(async () => {
  try {
    const res = await approveRequestBatch('DSP-2569-001', 'Test Admin');
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
})();
