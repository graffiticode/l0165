/* Copyright (c) 2023, ARTCOMPILER INC */
import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

export class Checker extends BasisChecker {
  HELLO(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const err = [];
      const val = node;
      resume(err, val);
    });
  }
}

const buildCell = ({ col, row, attrs, colsAttrs }) => {
  const cell = row[col];
  let content;
  let colspan = 1;
  let rowspan = 1;
  const colwidth = col === "_" && [40] || [colsAttrs[col]?.width];
  let background = attrs.color;
  const { text } = cell; //String(row[col]);
  content = [
    {
      "type": "paragraph",
      "content": text && [
        {
          "type": "text",
          text: String(text),
        }
      ]
    }
  ];
  return ({
    "type": "table_cell",
    "attrs": {
      colspan,
      rowspan,
      colwidth,
      width: "50px",
      height: "50px",
      background,
      ...colsAttrs[col],
      ...cell.attrs,
    },
    "content": content,
  });
};

const buildRow = ({ cols, row, attrs, colsAttrs }) => {
  return ({
    "type": "table_row",
    "content": cols.map(col => {
      return buildCell({col, row, attrs, colsAttrs});
    }),
  })
};

const buildTable = ({ cols, rows, attrs, colsAttrs }) => {
  return ({
    "type": "table",
    "content": rows.map((row, rowIndex) => {
      return buildRow({cols, row, colsAttrs, attrs: attrs[rowIndex]});
    })
  })
};

const buildDocFromTable = ({ cols, rows, colsAttrs }) => {
  const attrs = applyRules({ cols, rows });
  return {
    "type": "doc",
    "content": [
      {
        ...buildTable({cols, rows, attrs, colsAttrs}),
      },
    ]
  }
};

const applyRules = ({ cols, rows }) => {
  const argsCols = cols.slice(0, cols.length - 1);
  const totalCol = cols[cols.length - 1];
  const rowAttrs = []
  rows.forEach((row, rowIndex) => {
    let total = 0;
    argsCols.forEach(col => {
      total += +row[col];
    });
    if (rowAttrs[rowIndex] === undefined) {
      rowAttrs[rowIndex] = {};
    }
    rowAttrs[rowIndex].color = /*+row[totalCol] !== total && "#f99" ||*/ "#fff";
  });
  return rowAttrs;
};

const letters = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getCell = (row, col, cells) => (
  col === "_" && row !== 0 && {
    type: "th",
    text: row
  } ||
  row === 0 && col !== "_" && {
    type: "th",
    text: col
  } ||
    row !== 0 && col !== "_" && cells[`${col}${row}`] && {
      type: "td",
      ...cells[`${col}${row}`],
  } || {}
);

const makeEditorState = ({ type, columns, cells }) => {
  //x = x > 26 && 26 || x;  // Max col count is 26.
  const { x, y } = Object.keys(cells).reduce((dims, cellName) => {
    const x = letters.indexOf(cellName.slice(0, 1));
    const y = +cellName.slice(1);
    return {
      x: x > dims.x && x || dims.x,
      y: y > dims.y && y || dims.y,
    };
  }, {x: 0, y: 0});
  switch (type) {
  case "table": {
    const cols = Array.apply(null, Array(x + 1)).map((_, col) => letters[col])
    const rows = Array.apply(null, Array(y + 1)).map((_, row) =>
      cols.reduce((rows, col) =>
        ({
          ...rows,
          [col]: getCell(row, col, cells || {})
        }), {}
      )
    );
    return {
      doc: buildDocFromTable({
        cols,
        rows,
        colsAttrs: columns,
      }),
      selection: {
        type: "text",
        anchor: 1,
        head: 1,
      },
    };
  }
  default:
    return null;
  }
};

export class Transformer extends BasisTransformer {
  HELLO(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = [];
      const val = {
        ...data,
        hello: data.hello !== undefined ? data.hello : v0,
      };
      resume(err, val);
    });
  }

  IMAGE(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = [];
      const val = {
        image: v0,
        ...data,
      };
      resume(err, val);
    });
  }

  THEME(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const data = options?.data || {};
        const err = [];
        const val = {
          theme: v0,
          ...v1,
          ...data,
        };
        resume(err, val);
      });
    });
  }

  TABLE(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      this.visit(node.elts[1], options, async (e1, v1) => {
        const data = options?.data || {};
        const err = [];
        const val = {
          type: "table",
          editorState: makeEditorState({
            type: "table",
            ...v0
          }),
          ...v1,
        };
        resume(err, val);
      });
    });
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
