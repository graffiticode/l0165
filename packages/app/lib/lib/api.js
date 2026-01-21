import bent from "bent";

function getApiUrl() {
  const host = window.document.location.host;
  return host.indexOf("localhost") === 0 && "http://localhost:3100" || "https://api.graffiticode.org";
}

export const getApiTask = async ({ auth, id }) => {
  try {
    const headers = { "Authorization": auth.token };
    const apiUrl = getApiUrl();
    const getApiJSON = bent(apiUrl, "GET", "json");
    const { status, error, data: task } = await getApiJSON(`/task?id=${id}`, null, headers);
    if (status !== "success") {
      throw new Error(`failed to get task ${id}: ${error.message}`);
    }
    return task;
  } catch (err) {
    throw err;
  }
};

export const getApiData = async ({ accessToken, id }) => {
  try {
    const apiUrl = getApiUrl();
    const getApiJSON = bent(apiUrl, "GET", "json");
    const headers = {
      "Authorization": accessToken || "",
    };
    const { status, error, data } = await getApiJSON(`/data?id=${id}`, null, headers);
    if (status !== "success") {
      throw new Error(`failed to get task ${id}: ${error.message}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

export const postApiCompile = async ({ accessToken, id, data }) => {
  try {
    const headers = {
      authorization: accessToken,
      "x-graffiticode-storage-type": "persistent",
    };
    const apiUrl = getApiUrl();
    const post = bent(apiUrl, "POST", "json", headers);
    const body = { id, data };
    const resp = await post('/compile', body);
    if (resp.status !== "success") {
      throw new Error(`failed to post compile ${id}: ${error.message}`);
    }
    return resp.data;
  } catch (err) {
    console.log("L0165/postApiCompile() err=" + err);
    throw err;
  }
};
