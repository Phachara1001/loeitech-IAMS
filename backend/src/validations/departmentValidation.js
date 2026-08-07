export const validateDepartmentInput = (req, res, next) => {
  const { code, name } = req.body;
  const errors = [];

  if (!code || !code.trim()) errors.push('รหัสหน่วยงาน (code) เป็นข้อมูลที่จำเป็น');
  if (!name || !name.trim()) errors.push('ชื่อหน่วยงาน/ฝ่าย (name) เป็นข้อมูลที่จำเป็น');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};