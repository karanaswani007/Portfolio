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
  const requestPath = event.path || new URL(event.rawUrl).pathname;
  const apiPath = requestPath
    .replace(/^\/\.netlify\/functions\/api(?=\/|$)/, "")
    .replace(/^\/api(?=\/|$)/, "");

  await ensureDatabase();

  return expressHandler({
    ...event,
    path: `/api${apiPath}`
  }, context);
};
