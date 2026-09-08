export const validateUpdateProfileInput = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (name !== undefined && !name.trim()) {
    errors.push('ชื่อ-นามสกุล (name) ต้องไม่เป็นค่าว่าง');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ถูกต้อง', errors });
  }

  next();
};

export const validateChangePasswordInput = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push('รหัสผ่านปัจจุบัน (currentPassword) เป็นข้อมูลที่จำเป็น');

  if (!newPassword) errors.push('รหัสผ่านใหม่ (newPassword) เป็นข้อมูลที่จำเป็น');
  else if (newPassword.length < 8) errors.push('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');

  if (!confirmPassword) errors.push('ยืนยันรหัสผ่านใหม่ (confirmPassword) เป็นข้อมูลที่จำเป็น');
  else if (newPassword && newPassword !== confirmPassword) errors.push('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ถูกต้อง', errors });
  }

  next();
};

const ALLOWED_ROLES = ['ADMIN', 'STAFF', 'USER'];

/**
 * Admin สร้างผู้ใช้งานใหม่: ต้องกรอกชื่อ, อีเมล ให้ครบ ส่วน role ถ้าไม่ระบุ default เป็น USER
 */
export const validateCreateUserInput = (req, res, next) => {
  const { name, email, role } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('ชื่อ-นามสกุล (name) เป็นข้อมูลที่จำเป็น');

  if (!email) errors.push('อีเมล (email) เป็นข้อมูลที่จำเป็น');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง');

  if (role !== undefined && !ALLOWED_ROLES.includes(String(role).toUpperCase())) {
    errors.push('ระดับสิทธิ์ (role) ไม่ถูกต้อง ต้องเป็น admin, staff หรือ user');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};

/**
 * Admin แก้ไขผู้ใช้งานคนอื่น: แก้ได้บางส่วน (ไม่จำเป็นต้องส่งครบทุก field)
 */
export const validateUpdateUserByAdminInput = (req, res, next) => {
  const { name, email, role } = req.body;
  const errors = [];

  if (name !== undefined && !name.trim()) errors.push('ชื่อ-นามสกุล (name) ต้องไม่เป็นค่าว่าง');

  if (email !== undefined) {
    if (!email.trim()) errors.push('อีเมล (email) ต้องไม่เป็นค่าว่าง');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }

  if (role !== undefined && !ALLOWED_ROLES.includes(String(role).toUpperCase())) {
    errors.push('ระดับสิทธิ์ (role) ไม่ถูกต้อง ต้องเป็น admin, staff หรือ user');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ถูกต้อง', errors });
  }

  next();
};