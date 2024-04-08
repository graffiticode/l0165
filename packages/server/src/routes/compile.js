import { Router } from "express";
import { buildPostTasks } from "./tasks.js";
import { buildGetData } from "./data.js";
import {
  buildHttpHandler,
  parseAuthTokenFromRequest,
  optionsHandler
} from "./utils.js";
import { isNonNullObject } from "../util.js";
import { InvalidArgumentError } from "../errors/http.js";

function getItemsFromRequest(req) {
  const { body } = req;
  let items;
  if (body.item) {
    items = [].concat(body.item);
  } else if (body.id) {
    items = [].concat(body);
  } else {
    items = [].concat(body);
  }
  if (!(Array.isArray(items) && items.every(item => isNonNullObject(item)))) {
    throw new InvalidArgumentError("item must be a non-null object");
  }
  return items;
}

// TODO Wire up auth.
const buildPostCompileHandler = ({ compile }) => {
  return buildHttpHandler(async (req, res) => {
    const auth = ""; //req.auth.context;
    const authToken = ""; //parseAuthTokenFromRequest(req);
    const data = await compile({ auth, authToken, lang: "0001", ...req.body });
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  });
};

export default ({ compile }) => {
  const router = new Router();
  router.post("/", buildPostCompileHandler({ compile }));
  router.options("/", optionsHandler);
  return router;
};
