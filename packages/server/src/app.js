import EventEmitter from "events";
import errorHandler from "errorhandler";
import express from "express";
import methodOverride from "method-override";
import { createRequire } from "module";
import morgan from "morgan";
import cors from "cors";
import { buildValidateToken } from "./auth.js";
import { buildCompile } from "./comp.js";
import { compile as langCompile } from "./lang/index.js";
import * as routes from "./routes/index.js";

EventEmitter.defaultMaxListeners = 15;

const env = process.env.NODE_ENV || "development";

export const createApp = ({ authUrl } = {}) => {
  const compile = buildCompile({ langCompile });
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
  const validateToken = buildValidateToken({ authUrl });
  app.use(routes.auth({ validateToken }));

  // serve up static content from dist
  app.use(express.static('public'));

  // Routes
  app.use("/", routes.root());
  app.use("/compile", routes.compile({compile}));
  app.use("/form", routes.formRouter());

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err);
    res.sendStatus(500);
  });

  return app;
};
