import * as departmentRepository from '../repositories/departmentRepository.js';

export const getAllDepartments = async () => {
  return await departmentRepository.findAll();
};

export const getDepartmentById = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) {
    const err = new Error('ไม่พบหน่วยงาน/ฝ่ายนี้');
    err.status = 404;
    throw err;
  }
  return department;
};

export const createDepartment = async (data) => {
  try {
    return await departmentRepository.create(data);
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('มีรหัสหรือชื่อหน่วยงาน/ฝ่ายนี้อยู่ในระบบแล้ว');
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

export const updateDepartment = async (id, data) => {
  await getDepartmentById(id);
  try {
    return await departmentRepository.update(id, data);
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('มีรหัสหรือชื่อหน่วยงาน/ฝ่ายนี้อยู่ในระบบแล้ว');
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

export const deleteDepartment = async (id) => {
  await getDepartmentById(id);
  return await departmentRepository.remove(id);
};