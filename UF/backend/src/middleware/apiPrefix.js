export function apiPrefixRewrite(apiPrefix) {
  return (req, _res, next) => {
    if (apiPrefix !== "/api" && (req.url === apiPrefix || req.url.startsWith(`${apiPrefix}/`))) {
      req.url = req.url.replace(apiPrefix, "/api");
    }
    next();
  };
}
