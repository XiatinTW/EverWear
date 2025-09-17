// 404 錯誤處理中介層
function notFound(req, res, next) {
  // 忽略一些常見的瀏覽器請求，避免產生錯誤日誌
  const ignoredPaths = ['/favicon.ico', '/robots.txt', '/apple-touch-icon.png'];
  
  if (ignoredPaths.includes(req.originalUrl)) {
    return res.status(204).end();
  }

  const error = new Error(`找不到路徑 - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

module.exports = notFound;
