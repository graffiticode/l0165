/* Copyright (c) 2023, ARTCOMPILER INC */
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
