export const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, url, query, body } = req;

  // Log incoming request
  console.log(`\n[${new Date().toISOString()}] >>> REQUEST: ${method} ${url}`);
  if (query && Object.keys(query).length) {
    console.log(`  Query:`, JSON.stringify(query, null, 2));
  }
  
  if (body && Object.keys(body).length) {
    try {
      // Hide sensitive information like passwords if they exist
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) sanitizedBody.password = "********";
      console.log(`  Body:`, JSON.stringify(sanitizedBody, null, 2));
    } catch (err) {
      console.log(`  Body: [Could not stringify body: ${err.message}]`);
    }
  }

  // Intercept response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode, statusMessage } = res;
    
    const color = statusCode >= 400 ? "\x1b[31m" : "\x1b[32m"; // Red for errors, Green for success
    const reset = "\x1b[0m";

    console.log(`${color}[${new Date().toISOString()}] <<< RESPONSE: ${method} ${url} ${statusCode} ${statusMessage} (${duration}ms)${reset}`);
  });

  next();
};
