// Bọc handler async để lỗi được chuyển tới error middleware
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
