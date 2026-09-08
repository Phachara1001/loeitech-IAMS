export const validateLocationInput = (req, res, next) => {
  const { building, name } = req.body;
  const errors = [];

  if (!building || !building.trim()) errors.push('อาคาร (building) เป็นข้อมูลที่จำเป็น');
  if (!name || !name.trim()) errors.push('ห้อง (name) เป็นข้อมูลที่จำเป็น');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};