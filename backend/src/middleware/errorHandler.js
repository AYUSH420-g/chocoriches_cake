export function notFound(_req, res) {
  res.status(404).json({ message: "API route not found." });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
    res.status(409).json({
      message: `An account already exists with this ${field}. Please login or use another ${field}.`,
    });
    return;
  }

  const status = Number(error.statusCode || error.status || (error.name === "MulterError" ? 400 : 500));
  if (status >= 500) console.error(error);
  res.status(status).json({
    message: status >= 500 ? "Something went wrong on the ChocoRiches API." : error.message,
  });
}
