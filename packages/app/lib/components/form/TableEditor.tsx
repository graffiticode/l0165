/*
  TODO
  [ ] Handle single and double click and tab in cells
  [ ] Sort dependency tree & check for cycles
  [ ] Make expanderBuilders a module parameter
  [ ] BUG fix updating cells when clicking on headers
  [ ] Format numbers and dates using format patterns
  [x] Handle $ sign
  [x] Add dependencies of changed cells to dirty list
  [x] Add dependencies on init
  [x] Cache cell value when computing functions
  [x] Expand cell names using translatex to get dependencies
  [x] Support '=a1' and '=a1+b2' syntax
  [x] Fix bug focusing cell with text shorter than value
  [x] Support literals in expressions. E.g. =b2*0.14
  [x] Parse cell names in parselatex to fix '=a1*a2' and '=a1/a2'
  [x] Make row and column headings read only
  [x] Select cell adjacent to selected header
  [x] Handle unary `-` and `%`
  [x] Scoring by formula and text (vs value)
*/

import assert from "assert";
import React, { useState, useEffect, useRef } from 'react'; React;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
import "prosemirror-tables/style/tables.css";

import { EditorView } from 'prosemirror-view';
import {
  EditorState,
  TextSelection,
} from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { keymap } from 'prosemirror-keymap';

import {
//   addColumnAfter,
//   addColumnBefore,
//   deleteColumn,
//   addRowAfter,
//   addRowBefore,
//   deleteRow,
//   mergeCells,
//   splitCell,
//   setCellAttr,
//   toggleHeaderRow,
//   toggleHeaderColumn,
//   toggleHeaderCell,
  goToNextCell,
  //   deleteTable,
  //findCell,
  TableMap,
} from "prosemirror-tables";
import {
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables,
//  CellSelection,
} from "prosemirror-tables";

import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from "prosemirror-view";
import ReactDOM from 'react-dom/client';
import { MenuView } from './MenuView';
//import { debounce } from "lodash";

import { TransLaTeX } from "@artcompiler/translatex";
import { evalRules, cellNameRules, formatRules, normalizeRules } from './translatex-rules.js';
import Decimal from 'decimal.js';

const isValidDecimal = val => {
  try {
    new Decimal(val);
    return true;
  } catch (x) {
    x = x
    return false;
  }
};

const normalizeValue = text => {
  let result = [text];
  try {
    const options = {
      allowThousandsSeparator: true,
      ...normalizeRules,
    };
    if (text && text.length > 0 && text.indexOf("=") === 0) {
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val.split(",");
        }
      );
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
};

const equivFormula = (actual, expected) => {
  const normalizedActual = normalizeValue(actual);
  const normalizedExpected = normalizeValue(expected);
  return normalizedActual.every((val, index) => (
    isValidDecimal(val) &&
      isValidDecimal(normalizedExpected[index]) &&
      new Decimal(val).equals(new Decimal(normalizedExpected[index])) ||
      val === normalizedExpected[index]
  ));
};

const equivValue = (actual, expected) => (
  actual !== undefined && actual === expected || false
);

const scoreCell = ({ method, expected, points = 1 }, {val, formula}) => (
  method === "formula" && equivFormula(formula, expected) && points ||
    method === "value" && equivValue(val, expected) && points ||
  0
);

const menuPlugin = new Plugin({
  view(editorView) {
    const menuDiv = document.createElement('div');
    const root = ReactDOM.createRoot(menuDiv!);
    editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);
    const update = () => {
      root.render(
        <MenuView className="" editorView={editorView} />,
      );
    };
    update();
    return {
      update,
      destroy() {
        root.unmount();
      }
    };
  }
});

const applyDecoration = ({ doc, cells }) => {
  const decorations = [];
  cells.forEach(({ from, to, color, border }) => {
    decorations.push(Decoration.node(from, to, {
      style: `
        background-color: ${color};
        ${border};
      `
    }));
  });
  return DecorationSet.create(doc, decorations);
};

const getCellColor = (cell) => {
  const { row, col, name, background, lastFocusedCell, score } = cell;
  //const { expected } = assess || {};
  return row > 1 && col > 1 && score !== undefined && name !== lastFocusedCell && (
    score > 0 &&
      "#efe" ||
      "#fee"
  ) || background || null;
};

const sortAssessRowsToMatchActual = ({ cells, range }) => {
  const { primaryColumn, rows } = range;
  const order = Object.keys(cells).map(name => name.slice(0, 1) === primaryColumn && cells[name].val || null).filter(x => x !== null);
  const dataMap = new Map(rows.map(row => [row[primaryColumn]?.text, row]));
  const sortedRows = order.map(id => (id !== null ? dataMap.get(id) || null : null));
  console.log(
    "sortAssessRowsToMatchActual()",
    "order=" + JSON.stringify(order),
    "sortedRows=" + JSON.stringify(sortedRows, null, 2),
  );
  return sortedRows;
}

const getCellsValidationFromRangeValidation = ({ cells, range }) => {
  // TODO shape validation based on given cells if order === "actual".
  console.log(
    "getCellsValidationFromRangeValidation()",
    "cells=" + JSON.stringify(cells, null, 2),
    "range=" + JSON.stringify(range, null, 2),
  );
  const rows = sortAssessRowsToMatchActual({cells, range}) as [{id}];
  assert(range, "getCellsValidationFromRangeValidation() missing range value");
  //const { rows } = range;
  const cellsValidation = rows.reduce((cells, row, index) => (
    index = row?.id || index + 1,
    row && Object.keys(row).forEach(key => (
      row[key]?.attrs?.assess && (cells[key + index] = row[key])
    )),
    cells
  ), {});
  console.log(
    "getCellsValidationFromRangeValidation()",
    "cellsValidation=" + JSON.stringify(cellsValidation, null, 2),
  );
  return cellsValidation;
};

const getRangeValidations = ({ cells, validation }) => {
  const { ranges } = validation;
  const rangeName = Object.keys(ranges).find(key => (
    key    // return the first range name for now.
  ));
  // TODO Handle multiple ranges. Split cells by range.
  return [{
    range: ranges[rangeName],
    cells,
  }];
};

export const getCellsValidation = ({ cells, validation }) => {
  const rangeValidations = getRangeValidations({cells, validation});
  const cellsValidations = rangeValidations.map(rangeValidation => (
    getCellsValidationFromRangeValidation(rangeValidation)
  ));
  return cellsValidations[0];
};

export const scoreCells = ({ cells, validation }) => {
  const cellsValidation = getCellsValidation({cells, validation});
  return Object.keys(cellsValidation).reduce((cells, cellName) => (
    {
      ...cells,
      [cellName]: cells[cellName] && {
        ...cells[cellName],
        score: scoreCell(cellsValidation[cellName].attrs.assess, cells[cellName]),
      } || undefined,
    }
  ), cells);
};

const applyModelRules = (cellExprs, state, value, validation) => {
  const cells = getCells(cellExprs, state);
  // TODO score cells here.
  const scoredCells = scoreCells({ cells: value.cells, validation });
  const { doc, selection } = state;
  const { lastFocusedCell } = value;
  // Multiply first row and first column values and compare to body values.
  let cellColors = [];
  cells.forEach(cell => {
    const color = getCellColor({
      ...cell,
      lastFocusedCell,
      score: scoredCells[cell.name]?.score,
    });
    const { row, col } = cell;
    if (cellColors[row] === undefined) {
      cellColors[row] = [];
    }
    cellColors[row][col] = color;
  });
  const coloredCells = cells.map(cell => (
    {
      ...cell,
      readonly: cell.readonly,
      border: (
        cell.col === 1 && cell.row === 1 &&
          "border: 1px solid #ddd; border-right: 1px solid #aaa; border-bottom: 1px solid #aaa;" ||
          cell.col === 1 &&
          "text-align: center; border: 1px solid #ddd; border-right: 1px solid #aaa;" ||
          cell.row === 1 && "text-align: center; border: 1px solid #ddd; border-bottom: 1px solid #aaa;" ||
          selection.anchor > cell.from && selection.anchor < cell.to &&
          `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 2px solid royalblue;` ||
          `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 1px solid #ddd;`
      ),
      color: (cell.col === 1 || cell.row === 1) && "#fff" ||
        cellColors[cell.row][cell.col] || "#fff"
    }
  ));
  return applyDecoration({doc, cells: coloredCells});
}

const isTableCellOrHeader = node =>
      node.type.name === "table_cell" ||
      node.type.name === "table_header";

// const isTableCell = node =>
//       node.type.name === "table_cell";

const getCells = (cellExprs, state) => {
  const { doc } = state;
  const cells = [];
  let row = 0, col = 0;
  doc.descendants((node, pos) => {
    if (node.type.name === "table_row") {
      row++;
      col = 0;
    }
    if (isTableCellOrHeader(node)) {
      col++;
      const name = node.attrs.name;
      const text = cellExprs && name && cellExprs.cells[name]?.text || node.textContent;
      const val = cellExprs && name && cellExprs.cells[name]?.val;
      const formula = cellExprs && name && cellExprs.cells[name]?.formula;
      cells.push({
        row,
        col,
        name,
        text,
        val,
        formula,
        from: pos,
        to: pos + node.nodeSize,
        justify: node.attrs.justify,
        background: node.attrs.background,
        fontWeight: node.attrs.fontWeight,
        format: node.attrs.format,
        assess: node.attrs.assess,
      });
    }
  });
  return cells;
};

// const debouncedStateUpdate = debounce(({ state, editorState }) => {
//   state.apply({
//     type: "update",
//     args: {editorState},
//   });
// }, 1000);

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'paragraph',
      cellAttributes: {
        name: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.name || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.dataset = `data-name: ${value};`;
            }
          },
        },
        format: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.format || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.dataset = `data-format: ${value};`;
            }
          },
        },
        assess: {
          default: null,
          getFromDOM(dom) {
            return JSON.parse(dom.dataset.format) || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.dataset = `data-format: ${JSON.stringify(value)};`;
            }
          },
        },
        justify: {
          default: null,
          getFromDOM(dom) {
            return dom.style.textAlign || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `text-align: ${value};`;
          },
        },
        readonly: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.readonly || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs['data-readonly'] = value;
          },
        },
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
          },
        },
        fontWeight: {
          default: null,
          getFromDOM(dom) {
            return dom.style.fontWeight || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `font-weight: ${value};`;
          },
        },
        height: {
          default: null,
          getFromDOM(dom) {
            return dom.style.height || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `height: ${"24px"};`;
          },
        },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

const findTable = $pos => {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === "table") {
      return { pos: $pos.before(depth), node };
    }
  }
  return null;
}

const getTablePosition = state => {
  const { $from } = state.selection;
  const table = findTable($from);
  return table ? table.pos : null;
}

const letters = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getCellRowColFromName = name => {
  const colName = name.slice(0, 1);
  const rowName = name.slice(1);
  const col = letters.indexOf(colName);
  const row = +rowName;
  return {row, col};
};

const getCellNodeByName = ({ state, name }) => {
  const tablePos = getTablePosition(state);
  const tableNode = state.doc.nodeAt(tablePos);
  const tableMap = TableMap.get(tableNode);
  const { row, col } = getCellRowColFromName(name);
  const cellIndex = row * tableMap.width + col;
  const cellPos = tableMap.map[cellIndex] + tablePos + 1;
  const cellNode = state.doc.nodeAt(cellPos);
  return {node: cellNode, pos: cellPos};
}

const getAdjacentCellNodeByName = ({ state, name }) => {
  const { row, col } = getCellRowColFromName(name);
  const adjRow = row === 0 && row + 1 || row;
  const adjCol = col === 0 && col + 1 || col;
  const adjName = `${letters[adjCol]}${adjRow}`;
  return getCellNodeByName({state, name: adjName});
}

// const getCellNodeByName = ({doc, name}) => {
//   let result;
//   doc.descendants((node, pos) => {
//     if (result !== undefined) {
//       return false;
//     }
//     if (isTableCellOrHeader(node) && node.attrs.name === name) {
//       result = {node, pos};
//     }
//   });
//   result = result || {};
//   return result;
// };

const replaceCellContent = (editorView, name, newText, doMoveCursor = false) => {
  const { state, dispatch } = editorView;
  const { pos: cellPos, node: cellNode } = getCellNodeByName({state, name});
  if (!cellNode || !isTableCellOrHeader(cellNode)) {
    console.error("Invalid cell position or node type: " + JSON.stringify(cellNode, null, 2));
    return;
  }
  const contentStart = cellPos + 1;
  const contentEnd = cellPos + cellNode.nodeSize - 1;
  const paragraphNode = newText &&
        state.schema.node("paragraph", null, state.schema.text(newText)) ||
        state.schema.node("paragraph");
  const tr = state.tr;
  tr.replaceWith(contentStart, contentEnd, paragraphNode);
  if (doMoveCursor) {
    let cursorPos = contentStart + 1;
    tr.setSelection(TextSelection.create(tr.doc, cursorPos + newText.length));
  }
  dispatch(tr);
}

const evalCell = ({ env, name }) => {
  const text = env.cells[name]?.text || "";
  let result = {
    formula: text,
    val: text
  };
  try {
    const options = {
      allowThousandsSeparator: true,
      env: env.cells,
      ...evalRules,
    };
    if (text && text.length > 0 && text.indexOf("=") === 0) {
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = {
            ...result,
            val
          };
        }
      );
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
}

const formatCellValue = ({ env, name }) => {
  const { val, format } = env.cells[name] || {};
  let result = val;
  try {
    if (format && val.length > 0) {
      const options = {
        env: {format},
        ...formatRules,
      };
      TransLaTeX.translate(
        options,
        val, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val;
        }
      );
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
}

const getSingleCellDependencies = ({ env, name }) => {
  const text = env.cells[name]?.text || "";
  let result = text;
  try {
    const options = {
      allowThousandsSeparator: true,
      env: env.cells,
      ...cellNameRules,
    };
    if (text && text.length > 0 && text.indexOf("=") === 0) {
      // FIXME this condition is brittle.
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val.split(",").map(name => name.toUpperCase());
        }
      );
    } else {
      result = [];
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
};

const getCellDependencies = ({ env, names }) => {
  // Get the cells that `names` depend on.
  const deps = names.reduce((deps, name) => {
    const names = getSingleCellDependencies({env, name});
    return [...new Set([
      ...deps,
      ...names,
      ...getCellDependencies({env, names})
    ])];
  }, []);
  return deps;
};

const makeTableHeadersReadOnlyPlugin = new Plugin({
  props: {
    handleClickOn(view, pos, node, nodePos, event, direct) {
      pos = pos;
      nodePos = nodePos;
      event = event;
      direct = direct;
      const { state, dispatch } = view;

      // Check if the clicked node is a `table_header`
      if (node.type.name === "table_header") {
        // Create a CellSelection for the clicked cell
        const name = node.attrs.name || "_0";
        const { pos: adjPos, node: adjNode } = getAdjacentCellNodeByName({state, name});
        const cursorPos = adjPos + 2;
        const newText = adjNode.textContent;
        const selection = TextSelection.create(state.tr.doc, cursorPos + newText.length);

        // Dispatch the transaction to update the selection
        dispatch(state.tr.setSelection(selection));
        return true; // Prevent further handling
      }

      return false; // Allow other events to be handled normally
    },

    handleDOMEvents: {
      beforeinput(view, event) {
        const { state } = view;
        const { selection } = state;
        const $pos = selection.$anchor;

        for (let depth = $pos.depth; depth > 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === "table_header") {
            event.preventDefault();
            return true;
          }
        }
        return false;
      }
    },

    // handleKeyDown(view, event) {
    //   const { state } = view;
    //   const { selection } = state;
    //   const $pos = selection.$anchor;

    //   for (let depth = $pos.depth; depth > 0; depth--) {
    //     const node = $pos.node(depth);
    //     if (node.type.name === "table_header") {
    //       event.preventDefault(); // Block key event
    //       return true; // Stop further handling
    //     }
    //   }
    //   return false; // Allow other key events
    // }
  },

  filterTransaction(tr, state) {
    const { selection } = state;
    const $pos = selection.$anchor;

    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth);
      if (node.type.name === "table_header") {
        if (tr.steps.length > 0) {
          return false;
        }
      }
    }
    return true;
  }
});

const getResponses = cells => (
  Object.keys(cells).reduce(
    (acc, name) => {
      const {text, val, formula, assess} = cells[name];
      return assess && {
        ...acc,
        [name]: {text, val, formula},
      } || acc
    }, {}
  )
);

const buildCellPlugin = formState => {
  const self = new Plugin({
    view(editorView) {
      editorView = editorView;
      return {
        update(view) {
          const { state, dispatch } = view;
          const pluginState = self.getState(state);
          if (pluginState.dirtyCells.length > 0) {
            const tr = state.tr;
            tr.setMeta("updated", true);
            dispatch(tr);
          }
          const cells = {...pluginState.cells};
          pluginState.dirtyCells.forEach(name => {
            cells[name] = {
              ...cells[name],
              ...evalCell({ env: {cells}, name }),
            };
            const formattedVal = formatCellValue({env: {cells}, name});
            const { node } = getCellNodeByName({state: view.state, name});
            if (name !== pluginState.focusedCell && formattedVal !== node.textContent) {
              replaceCellContent(view, name, formattedVal);
            }
          });
          if (pluginState.focusedCell) {
            const name = pluginState.focusedCell;
            const text = pluginState.cells[name]?.text || "";
            const { node } = getCellNodeByName({state: view.state, name});
            if (node.type.name === "table_cell" && text !== node.textContent) {
              replaceCellContent(view, name, text, true);
            }
          }
        }
      };
    },
    state: {
      init(config, state) {
        config = config;
        const cellExprs = self.getState(state);
        const cells = getCells(cellExprs, state).reduce((cells, cell) => (
          cell.row > 1 && cell.col > 1 && {
            ...cells,
            [cell.name]: {
              ...cell,
              deps: [],
            }
          } || cells
        ), {});
        const dirtyCells = getCells(cellExprs, state).reduce((dirtyCells, cell) => (
          cell.row > 1 && cell.col > 1 && cell.text &&
            [...dirtyCells, cell.name] ||
            dirtyCells
        ), []);
        const cellsWithDeps = getCells(cellExprs, state).reduce((cells, cell) => {
          if (cell.row > 1 && cell.col > 1)  {
            const deps = getCellDependencies({env: {cells}, names: [cell.name]});
            const cellName = cell.name;
            return deps.reduce((cells, name) => {
              // Add current cell as dependency of independent cells.
              const { formula, val } = evalCell({env: {cells}, name});
              const cell = cells[name];
              return cell && {
                ...cells,
                [name]: {
                  ...cell,
                  formula,
                  val,
                  deps: [
                    ...cell?.deps,
                    cellName,
                  ],
                  format: cell.format,
                },
              } || cells;
            }, cells);
          } else {
            return cells;
          }
        }, cells);
        const allCells = dirtyCells.reduce((cells, name) => {
          // Add current cell as dependency of independent cells.
          const cell = cells[name];
          return cell && {
            ...cells,
            [name]: {
              ...cell,
              ...evalCell({env: {cells}, name}),
              deps: [
                ...cell?.deps,
              ],
            },
          } || cells;
        }, cellsWithDeps);
        const value = {
          lastFocusedCell: null,
          blurredCell: null,
          focusedCell: null,
          dirtyCells,
          cells: allCells,
        };
        const { validation } = formState.data;
        const decorations = applyModelRules(cellExprs, state, value, validation);
        return {
          ...value,
          decorations,
        }
      },
      apply(tr, value, oldState, state) {
        oldState = oldState;
        if (tr.getMeta("updated")) {
          value = {
            ...value,
            focusedCell: null,
            dirtyCells: [],
          };
        }
        const { selection } = state;
        const $anchor = selection.$anchor;
        const node = $anchor.node(-1);
        const name = node.attrs?.name;
        const lastFocusedCell = value.lastFocusedCell;
        if (lastFocusedCell !== name) {
          // We just left a cell, so compute its value, add to its dependencies
          // dependents list (`deps`), and recompute the value of its dependents.
          // console.log(
          //   "cellPlugin/apply()",
          //   "state=" + JSON.stringify(state, null, 2),
          //   "value=" + JSON.stringify(value, null, 2),
          //   "formState=" + JSON.stringify(formState, null, 2),
          // );
          if (lastFocusedCell && value.cells[lastFocusedCell]) {
            const cell = value.cells[lastFocusedCell];
            // Compute the value of `lastFocusedCell`.
            value = {
              ...value,
              blurredCell: lastFocusedCell,
              cells: {
                ...value.cells,
                [lastFocusedCell]: {
                  ...cell,
                  ...evalCell({env: value, name: lastFocusedCell}),
                },
              },
              dirtyCells: [
                ...value?.dirtyCells,
                lastFocusedCell,  // Order matters.
                ...(cell?.deps || []),
              ],
            };
            const deps = getCellDependencies({env: value, names: [lastFocusedCell]});
            value = deps.reduce((value, name) => {
              // Add as dependent to each dependency.
              const cell = value.cells[name];
              return cell && {
                ...value,
                cells: {
                  ...value.cells,
                  [name]: {
                    ...cell,
                    ...evalCell({env: value, name}),
                    deps: [
                      ...cell?.deps,
                      ...!cell.deps.includes(lastFocusedCell) && [lastFocusedCell] || [],
                    ],
                  },
                },
              } || value;
            }, value);
            value = cell.deps?.reduce((value, name) => {
              // Update the value of the dependents.
              const cell = value.cells[name];
              return cell && {
                ...value,
                cells: {
                  ...value.cells,
                  [name]: {
                    ...cell,
                    ...evalCell({env: value, name}),
                  },
                },
              } || value;
            }, value) || value;
          }
          value = {
            ...value,
            lastFocusedCell: node.attrs.name,
            focusedCell: node.attrs.name,
          };
          const cells = getResponses(value.cells);
          formState.apply({
            type: "response",
            args: {
              cells,
            },
          });
        } else if (isTableCellOrHeader(node) && node.attrs?.name) {
          const name = node.attrs.name;
          const text = node.textContent.trim();
          value = {
            ...value,
            blurredCell: null,
            focusedCell: null,
            dirtyCells: [],
            cells: {
              ...value.cells,
              [name]: {
                ...value.cells[name],
                ...evalCell({env: value, name}),
                text,
                formula: text,
              },
            },
          };
        }
        const cellExprs = self.getState(state);
        const { validation } = formState.data;
        const decorations = applyModelRules(cellExprs, state, value, validation);
        return {
          ...value,
          decorations,
        };
      }
    },
    props: {
      decorations(state) {
        return this.getState(state).decorations;
      }
    }
  });
  return self;
}

class ParagraphView {
  public dom;
  public contentDOM;
  private value = "";
  private textContent = "";
  private hasFocus = false;
  constructor(node, view) {
    view = view;
    this.dom = document.createElement("div");
    this.dom.className = "custom-paragraph";
    this.contentDOM = document.createElement("p");
    this.dom.appendChild(this.contentDOM);
    if (node.content.size == 0) this.dom.classList.add("empty")
  }
  update(node) {
    if (node.type.name !== "paragraph") {
      return false
    }
    this.dom.classList.remove("empty");
    if (this.hasFocus) {
      if (node.content.size > 0) {
        this.textContent = node.textContent;
        this.value = this.hasFocus && this.textContent.indexOf("sum") > 0 && "300" || this.textContent;
        this.contentDOM.textContent = this.textContent;
      } else {
        this.contentDOM.textContent = this.value || this.contentDOM.textContent;
        }
    } else {
      this.dom.classList.add("empty")
    }
    return true
  }
}

const buildCell = ({ col, row, attrs, colsAttrs }) => {
  colsAttrs = colsAttrs || {};
  const cell = row[col];
  let content;
  let colspan = 1;
  let rowspan = 1;
  const colwidth = col === "_" && [40] || [colsAttrs[col]?.width];
  let background = attrs.color;
  const { text } = cell;
  console.log(
    "buildCell()",
    "text=" + text,
  );
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
  const isHeader = cell.type === "th";
  return {
    "type": isHeader && "table_header" || "table_cell",
    "attrs": {
      name: `${col}${row._.text || 0}`,
      colspan,
      rowspan,
      colwidth,
      width: "50px",
      height: "24px",
      background,
      ...colsAttrs[col],
      ...cell.attrs,
    },
    "content": content,
  };
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
//  const totalCol = cols[cols.length - 1];
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
    const doc = buildDocFromTable({
      cols,
      rows,
      colsAttrs: columns,
    });
    return {
      doc: doc,
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

export const TableEditor = ({ state }) => {
  const [ editorView, setEditorView ] = useState(null);
  const cellPlugin = buildCellPlugin(state);
  const [ plugins ] = useState([
    columnResizing(),
    tableEditing(),
    history(),
    keymap({"Mod-z": undo, "Mod-y": redo}),
    keymap({
      ...baseKeymap,
      Enter: goToNextCell(1),
      Tab: goToNextCell(1),
      'Shift-Tab': goToNextCell(-1),
    }),
    menuPlugin,
    //  modelBackgroundPlugin(),
    makeTableHeadersReadOnlyPlugin,
    cellPlugin,
  ]);
  const editorRef = useRef(null);
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    let initEditorState = EditorState.create({
      schema,
      plugins,
    });
    const fix = fixTables(initEditorState);
    if (fix) initEditorState = initEditorState.apply(fix.setMeta('addToHistory', false));
    const editorView = new EditorView(editorRef.current, {
      state: initEditorState,
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        // debouncedStateUpdate({
        //   state,
        //   editorState: editorState.toJSON()
        // });
      },
      nodeViews: {
        paragraph(node, view) { return new ParagraphView(node, view) }
      }
    });
    setEditorView(editorView);
    return () => {
      console.log("editorView.destroy()");
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  const { type, columns, cells } = state.data.interaction;
  // const templateVariablesRecords = state.data.templateVariablesRecords || [];
  // const index = Math.floor(Math.random() * templateVariablesRecords.length);
  // const env = templateVariablesRecords[index];
  useEffect(() => {
    if (editorView && columns && cells) {
      const editorStateData = makeEditorState({type, columns, cells});
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorStateData);
      editorView.updateState(newEditorState);
      const { pos } = getCellNodeByName({state: newEditorState, name: "A1"});
      if (!pos) return;
      const resolvedPos = newEditorState.doc.resolve(pos);
      editorView.dispatch(editorView.state.tr.setSelection(new TextSelection(resolvedPos)));
    }
  }, [editorView, columns, cells]);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white text-xs font-sans"
    />
  );
};
