#!/usr/bin/env node

import { createApp } from "./app.js";

const port = process.env.PORT || "50002";
const authUrl = process.env.AUTH_URL || "https://auth.graffiticode.org";
console.log("AUTH_URL=" + process.env.AUTH_URL);

const app = createApp({ authUrl });
app.listen(port, () => {
  console.log(`Listening on ${port}...`);
});

process.on("uncaughtException", (err) => {
  console.log(`ERROR Caught exception: ${err.stack}`);
});
