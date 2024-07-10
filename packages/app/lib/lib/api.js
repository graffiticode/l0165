import bent from "bent";

function getApiUrl() {
  const host = window.document.location.host;
  return host.indexOf("localhost") === 0 && "http://localhost:3100" || "https://api.graffiticode.com";
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
    console.log("postApiCompile() err=" + err);
    throw err;
  }
};

// export const postCompile = async ({ id, data }) => {
//   const query = gql`
//     mutation (id: String!, data: String!) {
//       compile(id: $id, data: $data)
//     }
//   `;
//   // const token = await user.getToken();
//   const client = new GraphQLClient("/api", {
//     headers: {
//       // authorization: token,
//     }
//   });
//   return client.request(query, { id, daa }).then(data => data.compile);
// };

