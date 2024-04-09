export const buildCompile = ({ getBaseUrlForLanguage, bent }) => async (lang, req) => {
  console.log("buildCompile() lang=" + lang + " body=" + JSON.stringify(req.body, null, 2));
  const baseUrl = getBaseUrlForLanguage(lang);
  const compilePost = bent(baseUrl, "POST", "json", 200, 202);
  return await compilePost("/compile", req);
};
