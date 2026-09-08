const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterInput = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('ชื่อ-นามสกุล (name) เป็นข้อมูลที่จำเป็น');

  if (!email) errors.push('อีเมล (email) เป็นข้อมูลที่จำเป็น');
  else if (!EMAIL_REGEX.test(email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง');

  if (!password) errors.push('รหัสผ่าน (password) เป็นข้อมูลที่จำเป็น');
  else if (password.length < 8) errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');

  if (!confirmPassword) errors.push('ยืนยันรหัสผ่าน (confirmPassword) เป็นข้อมูลที่จำเป็น');
  else if (password && password !== confirmPassword) errors.push('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username) errors.push('ชื่อผู้ใช้งานหรืออีเมล (username) เป็นข้อมูลที่จำเป็น');
  if (!password) errors.push('รหัสผ่าน (password) เป็นข้อมูลที่จำเป็น');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};

export const validateForgotPasswordInput = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) errors.push('อีเมล (email) เป็นข้อมูลที่จำเป็น');
  else if (!EMAIL_REGEX.test(email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};

export const validateResetPasswordInput = (req, res, next) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!email) errors.push('อีเมล (email) เป็นข้อมูลที่จำเป็น');
  if (!code) errors.push('รหัสยืนยัน (code) เป็นข้อมูลที่จำเป็น');

  if (!newPassword) errors.push('รหัสผ่านใหม่ (newPassword) เป็นข้อมูลที่จำเป็น');
  else if (newPassword.length < 8) errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');

  if (!confirmPassword) errors.push('ยืนยันรหัสผ่าน (confirmPassword) เป็นข้อมูลที่จำเป็น');
  else if (newPassword && newPassword !== confirmPassword) errors.push('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง', errors });
  }

  next();
};