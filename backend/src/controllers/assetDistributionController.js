import * as assetDistributionService from '../services/assetDistributionService.js';

export const getDistributions = async (req, res, next) => {
  try {
    const data = await assetDistributionService.getAllDistributions();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createDistribution = async (req, res, next) => {
  try {
    const data = await assetDistributionService.createDistribution(req.body);
    res.status(201).json({ status: 'success', data, message: 'จัดสรรครุภัณฑ์เสร็จสิ้นเรียบร้อย' });
  } catch (error) {
    next(error);
  }
};
