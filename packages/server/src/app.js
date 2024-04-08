import EventEmitter from "events";
import errorHandler from "errorhandler";
import express from "express";
import methodOverride from "method-override";
import { createRequire } from "module";
import morgan from "morgan";
import cors from "cors";
import { buildValidateToken } from "./auth.js";
import { compile } from "./compile.js";
import * as routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

EventEmitter.defaultMaxListeners = 15;

const env = process.env.NODE_ENV || "development";

export const createApp = ({ authUrl } = {}) => {
  const app = express();
  app.all("*", (req, res, next) => {
    if (req.headers.host.match(/^localhost/) === null) {
      if (req.headers["x-forwarded-proto"] !== "https" && env === "production") {
        console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
        res.redirect(["https://", req.headers.host, req.url].join(""));
      } else {
        next();
      }
    } else {
      next();
    }
  });

  if (["development", "test"].includes(env)) {
    app.use(morgan("dev"));
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  } else {
    app.use(morgan("combined", {
      skip: (req, res) => res.statusCode < 400
    }));
  }
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(methodOverride());

  // Authentication
  // const validateToken = buildValidateToken({ authUrl });
  // app.use(routes.auth({ validateToken }));

  // serve up static content from dist
  app.use(express.static('dist'));
  app.use(express.static('public'));

  // Routes
  app.use("/", routes.root());
  app.use("/compile", routes.compile({compile}));
  app.get("/form", function (req, res) {
    console.log("GET /form query=" + JSON.stringify(req.query, null, 2));
    res.sendFile(path.join(__dirname.slice(0, __dirname.length - "/src".length), 'dist', 'index.html'));
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err);
    res.sendStatus(500);
  });

  return app;
};
