export const buildCompile = ({ langCompile }) =>
  ({ lang, code, data = {}, auth = null, options = {} }) => {
    console.log("buildCompile() lang=" + lang + " code=" + code);
    return langCompile(`L${lang}`, { code, data, auth, options });
  };
