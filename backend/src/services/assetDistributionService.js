import * as assetDistributionRepository from '../repositories/assetDistributionRepository.js';

export const getAllDistributions = async () => {
  return await assetDistributionRepository.findAll();
};

export const createDistribution = async (data) => {
  return await assetDistributionRepository.create(data);
};
