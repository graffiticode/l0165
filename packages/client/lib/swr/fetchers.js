import { postApiCompile } from "../lib/api";
export const compile = async ({ accessToken, id, data }) => {
  try {
    const index = Object.keys(data).length > 0 && 1 || 2; // Empty data so use full id.
    id = id.split("+").slice(0, index).join("+");  // Re-compile state with code id.
    return await postApiCompile({ accessToken, id, data });
  } catch (x) {
    console.log("./swr/fetchers/compile()");
    console.log(x.stack);
  }
};
