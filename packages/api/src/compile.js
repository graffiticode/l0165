import { compiler } from './compiler.js';
export async function compile({ auth, authToken, code, data, config }) {
  // console.log("compile() code=" + JSON.stringify(code, null, 2));
  // console.log("compile() data=" + JSON.stringify(data, null, 2));
  if (!code || !data) {
    return res.status(400).send();
  }
  return await new Promise((resolve, reject) =>
    compiler.compile(code, data, config, (err, data) => {
      if (err && err.length) {
        resolve({error: err});
      } else {
        resolve(data);
      }
    })
  );
}
