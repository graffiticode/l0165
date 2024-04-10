import { isNonEmptyString, getClientHost, getClientPort } from "../util.js";
import { HttpError } from "./../errors/http.js";
import { gql, GraphQLClient } from "graphql-request";

const normalizeIds = ids => ids.map(id => id.split(/[ ]/g).join("+"));

export const parseIdsFromRequest = req => {
  const id = req.query.id;
  if (isNonEmptyString(id)) {
    return normalizeIds(id.split(","));
  }
  return [];
};

export const parseAuthTokenFromRequest = req => {
  const { access_token: queryAuthToken } = req.query;
  if (isNonEmptyString(queryAuthToken)) {
    return queryAuthToken;
  }
  const { auth: bodyAuthToken } = req.body;
  if (isNonEmptyString(bodyAuthToken)) {
    return bodyAuthToken;
  }
  let headerAuthToken = req.get("Authorization");
  if (isNonEmptyString(headerAuthToken)) {
    if (headerAuthToken.startsWith("Bearer ")) {
      headerAuthToken = headerAuthToken.slice("Bearer ".length);
    }
    return headerAuthToken;
  }
  return null;
};

const handleError = (err, res, next) => {
  if (err instanceof HttpError) {
    res
      .status(err.statusCode)
      .json(createErrorResponse(createError(err.code, err.message)));
  } else {
    next(err);
  }
};

export const buildHttpHandler = handler => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const createError = (code, message) => ({ code, message });

export const createErrorResponse = error => ({ status: "error", error });

export const createCompileSuccessResponse = ({ id, data }) => ({ status: "success", id, data });

export const createSuccessResponse = ({ data }) => ({ status: "success", data });

export const getStorageTypeForRequest = req => {
  return (
    req.get("x-graffiticode-storage-type") || "ephemeral"
  );
};

export const optionsHandler = buildHttpHandler(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Request-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type");
  res.set("Connection", "Keep-Alive");
  res.sendStatus(204);
});

export const buildCompileLogger = () => {
  const host = getClientHost();
  const port = getClientPort();
  const protocol = host.indexOf("localhost") >= 0 && "http" || "https";
  const endpoint = `${protocol}://${host}:${port}/api`;
  return ({ token, id, status, timestamp, data }) => {
    if (!token) {
      return;
    }
    const client = new GraphQLClient(endpoint, {
      headers: {
        Authorization: token
      }
    });
    const query = gql`
    mutation post ($id: String!, $status: String!, $timestamp: String!, $data: String!) {
      logCompile(id: $id, status: $status, timestamp: $timestamp, data: $data)
    }
  `;
    client.request(query, { id, status, timestamp, data: JSON.stringify(data) }).then((data) => console.log(data));
  };
};
