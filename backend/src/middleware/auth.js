import jwt from 'jsonwebtoken';

/**
 * ตรวจสอบว่ามี JWT token ถูกต้องแนบมาใน header หรือไม่
 * ใช้กับ route ที่ต้อง login ก่อนถึงจะเข้าถึงได้
 * ถ้าผ่าน จะแนบข้อมูลผู้ใช้งานไว้ที่ req.user = { id, username, role }
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    err.status = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (error) {
    const err = new Error('เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    err.status = 401;
    next(err);
  }
};

/**
 * ตรวจสอบว่า role ของผู้ใช้งานอยู่ในรายการที่อนุญาตหรือไม่
 * ใช้ต่อจาก authenticate เสมอ เช่น: router.get('/', authenticate, authorize('ADMIN', 'STAFF'), controller)
 */
export const authorize = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !normalizedRoles.includes(String(req.user.role).toUpperCase())) {
      const err = new Error('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
      err.status = 403;
      return next(err);
    }
    next();
  };
};