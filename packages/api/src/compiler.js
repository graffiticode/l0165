/* Copyright (c) 2023, ARTCOMPILER INC */
import assert from "assert";
import Decimal from "decimal.js";
import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

const getValidation = cells => (
  Object.keys(cells).reduce((obj, key) => ({
    ...obj,
    points: obj.points + (cells[key]?.attrs?.assess && (cells[key]?.attrs?.assess?.points || 1) || 0), 
    values: {
      ...obj.values,
      [key]: cells[key]?.attrs?.assess && cells[key].attrs.assess || undefined,
    },
  }), {points: 0, values: {}})
);

export class Checker extends BasisChecker {
  HELLO(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const err = [];
      const val = node;
      resume(err, val);
    });
  }
}

const MAX_LIMIT = 249;

export class Transformer extends BasisTransformer {
  TABLE(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        console.log(
          "TABLE",
          "v0=" + JSON.stringify(v0, null, 2),
          "v1=" + JSON.stringify(v1, null, 2),
        );
        const data = options?.data || {};
        const err = [];
        const val = {
          validation: getValidation(v0.cells),
          interaction: {
            type: "table",
            ...v0,
          },
          ...v1,
        };
        console.log(
          "TABLE",
          "val=" + JSON.stringify(val, null, 2),
        );
        resume(err, val);
      });
    });
  }

  PARAMS(node, options, resume) {
    // params {
    //   "+": "+",
    //   "a": " ",
    //   "b": "1",
    //   "c": "2",
    //   "d": " ",
    //   "e": "3",
    //   "f": "5",
    // }
    // values [
    //   ["+", "a", "b", "c", "d", "e", "f"],
    //   ["+", " ", "1", "2", " ", "3", "4"],
    // ]
    this.visit(node.elts[0], options, (err1, val1) => {
      if (err1 && err1.length) {
        resume(err1);
        return;
      }
      let values = [];
      let params = options.data && options.data.params
        ? options.data.params  // Use form data.
        : val1;                // Use defaults.
      if (params) {
        let keys;
        let vals;
        if (Array.isArray(params)) {
          keys = params[0];
          vals = params.slice(1);
        } else {
          keys = Object.keys(params);
          vals = [Object.values(params)];
          params = [keys].concat(vals);  // Make new form for params.
        }
        keys.forEach((k, i) => {
          keys[i] = k.trim();
        });
        // Create first row using param names.
        values.push(keys);
        vals.forEach((v) => {
          values = values.concat(generateDataFromArgs(keys, v));
        });
      }
      options.params = params;
      let limit = options.data.limit || val1.limit || MAX_LIMIT;
      limit = (limit < values.length) && limit || values.length;
      limit = (limit < MAX_LIMIT) && limit || MAX_LIMIT;
      if (values.length > limit) {
        console.log(`WARNING truncating seed list to ${limit} values.`);
        values = values.slice(0, limit + 1); // Plus 1 because column names.
      }
      const vals = values.slice(1).map(vals => (
        buildEnv(values[0], vals)
      ));
      resume([], vals);
    });

    function expandArgs(args) {
      const table = [];
      args = args || [];
      args.forEach((s) => {
        const exprs = s.split(',');
        const vals = [];
        exprs.forEach((expr) => {
          const [r, _incr = 1] = expr.split(':');
          const [start, _stop] = r.split('..');
          let incr = _incr;
          let stop = _stop;
          if (+start >= +stop) {
            // Guard against nonsense.
            stop = undefined;
          }
          if (stop === undefined) {
            vals.push(start);
          } else {
            let e; let n; let
t;
            if (!Number.isNaN(parseFloat(start))) {
              t = 'F';
              n = parseFloat(start);
              e = parseFloat(stop);
            } else {
              t = 'V';
              n = start.charCodeAt(0);
              e = stop.charCodeAt(0);
            }
            incr = Number.isNaN(+incr) ? 1 : +incr;
            let i = new Decimal(0);
            for (; i.cmp(new Decimal(e).sub(n)) <= 0; i = i.add(incr)) {
              // Expand range
              switch (t) {
              case 'F':
                vals.push(String(new Decimal(n).add(i)));
                break;
              case 'V':
                vals.push(String.fromCharCode(n + i) + start.substring(1));
                break;
              default:
                break;
              }
            }
          }
        });
        table.push(vals);
      });
      return table;
    }

    function buildEnv(keys, vals) {
      const env = {}; // Object.assign({}, params);
      keys.forEach((k, i) => {
        if (vals[i] !== undefined) {
          // env[k] = {
          //   type: 'const',
          //   value: vals[i],
          // };
          env[k] = vals[i];
        }
      });
      return env;
    }

    function evalExpr(env, expr, resume) {
      if (expr.indexOf('=') === 0) {
        expr = expr.substring(1);
        assert(false, "not yet implemented");
      } else {
        resume([], expr);
      }
    }

    function generateDataFromArgs(keys, args) {
      const table = expandArgs(args);
      let data = [];
      let count = 0;
      for (let i = 0; i < table.length; i++) {
        // Expand the current set with each parameter (i).
        let row;
        const len = data.length; // Current number of unexpanded rows.
        const newData = [];
        for (let j = 0; j < table[i].length; j++) {
          // For each value (j) of each parameter (i).
          const val = table[i][j];
          if (len === 0) {
            // First time through so just push the value as a column.
            newData.push([val]);
          } else {
            for (let k = 0; k < len && (count < MAX_LIMIT + len || j < 1); k++) {
              // Add a new row which is the old row (k) extended by the current column value (i, j).
              const env = buildEnv(keys, data[k]);
              evalExpr(env, val, (err, val) => {
                row = [].concat(data[k]).concat(val);
                newData.push(row);
              });
              count++;
            }
          }
        }
        data = newData;
      }
      return data;
    }
  }

  PROG(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = e0;
      const val = v0.pop();
      resume(err, {
        ...val,
        ...data,
      });
    });
  }
}

export const compiler = new BasisCompiler({
  langID: '0151',
  version: 'v0.0.1',
  Checker: Checker,
  Transformer: Transformer,
});
