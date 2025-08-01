/* Copyright (c) 2023, ARTCOMPILER INC */
import assert from "assert";
import Decimal from "decimal.js";
import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

const rowInRange = (range, cellName) => {
  const [min, max] = range.split("..");
  const row = cellName.slice(1);
  return +row >= +min || +row <= +max;
};

const getPrimaryColumn = (rows, cellName) => {
  // Check rows to see if cellName is included.
  // If so, return the index col.
  const range = rows && Object.keys(rows).find(key =>
    (key === "*" || rowInRange(key, cellName)) && key
  ) || "*";
  return [range, rows && rows[range]?.assess?.index || null];
};

const getIndexCell = (cells, colName, cellName) => (
  // Get the cell of the index col for the same row as cellName.
  // If there is an assess field, return it.
  // If not, then return null.
  cells[colName + cellName.slice(1)]
);

// TODO Scoring will find a match for the index assess and then score the
// current cell with its assess.
// If there is no assess in the index cell, then the cell is scored as is.

const getValidation = ({rows = {}, cells = {}}) => (
  // TODO compile the index column and value for each validated cell.
  Object.keys(cells).reduce((obj, key) => {
    const [rowRange, primaryColumn] = getPrimaryColumn(rows, key);
    const cell = cells[key];
    const col = key.slice(0, 1);
    const rowIndex = +key.slice(1) - 1;
    const order = rows[rowRange]?.assess?.order || "expected";  // "actual", "asc", "desc", "expected" (default)
    const row = obj.ranges[rowRange]?.rows[rowIndex] || {}
    // Replace the current row in rows
    const newRows = obj.ranges[rowRange]?.rows || [];
    newRows[rowIndex] = {
      ...row,
      id: order !== "actual" && rowIndex + 1 || undefined,
      [col]: cell,
    };
    const points = cells[key]?.attrs?.assess && cells[key]?.attrs?.assess?.points;
    return {
      ...obj,
      points: obj.points + (typeof points === "number" ? points : 0),
      ranges: {
        ...obj.ranges,
        [rowRange]: {
          primaryColumn: primaryColumn,
          order,
          rows: newRows,
        },
      },
    }
  }, {points: 0, ranges: {}, cells: {}})
);

export class Checker extends BasisChecker {
  HELLO(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const err = [];
      const val = node;
      resume(err, val);
    });
  }

  TITLE(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }

  INSTRUCTIONS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }

  CELLS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }

  ROWS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }

  COLUMNS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }
}

const MAX_LIMIT = 249;

export class Transformer extends BasisTransformer {
  TITLE(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = {
          ...v1,
          title: v0,
        };
        resume(err, val);
      });
    });
  }

  INSTRUCTIONS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = {
          ...v1,
          instructions: v0,
        };
        resume(err, val);
      });
    });
  }

  CELLS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        console.log(
          "CELLS()",
          "v0=" + JSON.stringify(v0, null, 2),
          "v1=" + JSON.stringify(v1, null, 2),
        );
        const err = [];
        // Normalize cell attributes - make textAlign and align into justify
        const normalizedCells = {};
        Object.keys(v0).forEach(cellKey => {
          const cell = v0[cellKey];
          const normalizedCell = { ...cell };
          // If cell has attrs
          if (normalizedCell.attrs) {
            // If textAlign or align is present but justify is not, use it for justify
            if ((normalizedCell.attrs.textAlign || normalizedCell.attrs.align) && !normalizedCell.attrs.justify) {
              normalizedCell.attrs.justify = normalizedCell.attrs.textAlign || normalizedCell.attrs.align;
            }
            // If numberFormat is present but format is not, use it for format
            if (normalizedCell.attrs.numberFormat && !normalizedCell.attrs.format) {
              normalizedCell.attrs.format = normalizedCell.attrs.numberFormat;
            }
            // If backgroundColor is present but background is not, use it for background
            if (normalizedCell.attrs.backgroundColor && !normalizedCell.attrs.background) {
              normalizedCell.attrs.background = normalizedCell.attrs.backgroundColor;
            }
          }
          normalizedCells[cellKey] = normalizedCell;
        });
        const val = {
          ...v1,
          cells: normalizedCells,
        };
        resume(err, val);
      });
    });
  }

  ROWS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        const val = {
          ...v1,
          rows: v0,
        };
        resume(err, val);
      });
    });
  }

  COLUMNS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const err = [];
        // Normalize column attributes - make textAlign and align into justify
        const normalizedColumns = {};
        Object.keys(v0).forEach(colKey => {
          const column = v0[colKey];
          const normalizedColumn = { ...column };
          // If textAlign or align is present but justify is not, use it for justify
          if ((column.textAlign || column.align) && !column.justify) {
            normalizedColumn.justify = column.textAlign || column.align;
          }
          // If numberFormat is present but format is not, use it for format
          if (column.numberFormat && !column.format) {
            normalizedColumn.format = column.numberFormat;
          }
          // If backgroundColor is present but background is not, use it for background
          if (column.backgroundColor && !column.background) {
            normalizedColumn.background = column.backgroundColor;
          }
          normalizedColumns[colKey] = normalizedColumn;
        });
        const val = {
          ...v1,
          columns: normalizedColumns,
        };
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
      resume([], {
        templateVariablesRecords: vals
      });
    });

    function expandArgs(args) {
      const table = [];
      args = args || [];
      args.forEach((s) => {
        const exprs = s.split(',');
        const vals = [];
        exprs.forEach(expr => {
          const [r, _incr = 1] = expr.split(':');
          const [start, _stop] = r.split('..');
          let incr = _incr;
          let stop = _stop;
          if (+start >= +stop) {
            // Guard against nonsense.
            stop = undefined;
          }
          if (stop === undefined) {
            vals.push(start.trim());
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
      v0 = v0.pop();  // Get last expression.
      console.log(
        "PROG()",
        "v0=" + JSON.stringify(v0, null, 2),
      );
      const { templateVariablesRecords, title, instructions, ...tableData } = v0;
      const val = {
        title,
        instructions,
        templateVariablesRecords,
        validation: getValidation(v0),
        interaction: {
          type: "table",
          ...tableData,
        },
      };
      resume(err, {
        ...val,
        ...data,
      });
    });
  }
}

export const compiler = new BasisCompiler({
  langID: '0165',
  version: 'v0.0.1',
  Checker: Checker,
  Transformer: Transformer,
});
