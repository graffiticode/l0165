import { createClient } from "@graffiticode/auth/client";
import { UnauthenticatedError } from "./errors/http.js";

export const buildValidateToken = ({ authUrl = "https://auth.graffiticode.com" }) => {
  const client = createClient(authUrl);
  return async token => {
    try {
      return await client.verifyToken(token);
    } catch (err) {
      throw new UnauthenticatedError(`${err.code} - ${err.message}`);
    }
  };
};
