import * as locationRepository from '../repositories/locationRepository.js';

export const getAllLocations = async () => {
  return await locationRepository.findAll();
};

export const getLocationById = async (id) => {
  const location = await locationRepository.findById(id);
  if (!location) {
    const err = new Error('ไม่พบอาคาร/ห้องนี้');
    err.status = 404;
    throw err;
  }
  return location;
};

export const createLocation = async (data) => {
  try {
    return await locationRepository.create(data);
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('มีห้องนี้ในอาคารนี้อยู่ในระบบแล้ว');
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

export const updateLocation = async (id, data) => {
  await getLocationById(id);
  try {
    return await locationRepository.update(id, data);
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('มีห้องนี้ในอาคารนี้อยู่ในระบบแล้ว');
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

export const deleteLocation = async (id) => {
  await getLocationById(id);
  return await locationRepository.remove(id);
};