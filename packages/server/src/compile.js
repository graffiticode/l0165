import { compiler } from './compiler.js';
export async function compile({ auth, authToken, code, data, config }) {
  if (!code || !data) {
    return res.status(400).send();
  }
  return await new Promise((resolve, reject) =>
    compiler.compile(code, data, config, (err, data) => {      
      if (err && err.length) {
        reject({error: err});
      } else {
        resolve(data);
      }
    })
  );
}
