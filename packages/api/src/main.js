#!/usr/bin/env node

import { createApp } from "./app.js";

const port = process.env.PORT || "50151";
const authUrl = process.env.AUTH_URL || "https://auth.graffiticode.org";
const app = createApp({ authUrl });
app.listen(port, () => {
  console.log(`Using authUrl ${process.env.AUTH_URL}`);
  console.log(`Listening on ${port}...`);
});

process.on("uncaughtException", (err) => {
  console.log(`ERROR Caught exception: ${err.stack}`);
});
