const serverless = require("serverless-http");
const { app, initializeDatabase } = require("../../server");

const expressHandler = serverless(app);
let databaseInitialization;

function ensureDatabase() {
  if (!databaseInitialization) {
    databaseInitialization = initializeDatabase().catch(error => {
      databaseInitialization = undefined;
      throw error;
    });
  }

  return databaseInitialization;
}

exports.handler = async (event, context) => {
  const functionPath = event.path.match(/^\/\.netlify\/functions\/api(?:\/(.*))?$/);
  if (!functionPath) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API route not found." })
    };
  }

  await ensureDatabase();

  return expressHandler({
    ...event,
    path: `/api/${functionPath[1] || ""}`
  }, context);
};
