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
} from "prosemirror-tables";
import { tableEditing, columnResizing, tableNodes, fixTables } from "prosemirror-tables";

import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from "prosemirror-view";
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

import { Parser } from "@artcompiler/parselatex";

const menuPlugin = new Plugin({
  view(editorView) {
    let menuDiv = document.createElement('div');
    editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);
    const update = () => {
      ReactDOM.render(
        <MenuView className="" editorView={editorView} />,
        menuDiv
      );
    };
    update();
    return {
      update,
      destroy() {
        ReactDOM.unmountComponentAtNode(menuDiv);
        menuDiv.remove();
      }
    };
  }
});

// const createFooWidget = (view, getPos) => {
//   const pos = getPos();
//   console.log("createFooWidget() pos=" + pos);
//   if (!pos) return;
//   const resolvedPos = view.state.doc.resolve(pos);
//   console.log("createFooWidget() depth=" + resolvedPos.depth);
//   const nodeAtPos = resolvedPos.node(resolvedPos.depth);
//   console.log("createFooWidget() nodeAtPos=" + JSON.stringify(nodeAtPos, null, 2));
//   if (nodeAtPos.type.name !== "paragraph") return;
//   const textContent = nodeAtPos.textContent;
//   console.log("createFooWidget() textContent=" + textContent);
//   const span = document.createElement("span");
//   span.textContent = `eval(${textContent})`;
//   span.style.display = "none";
//   return span;
// };

// const fooDecoration = (pos) => {
//   return Decoration.widget(pos, createFooWidget, { side: 1 });
//   // side: 1 places the widget after the position
// };

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
  // doc.descendants((node, pos) => {
  //   if (node.isBlock && node.type.name === "paragraph") {
  //     decorations.push(fooDecoration(pos + node.nodeSize - 1)); // Append at the end of the paragraph
  //   }
  // });
  return DecorationSet.create(doc, decorations);
};

const applyModelRules = (state) => {
  const { doc, selection } = state;
  console.log("applyModelRules() doc=" + JSON.stringify(doc, null, 2));
  // Multiply first row and first column values and compare to body values.
  const cells = getCells(doc);
  let rowVals = [];
  let colVals = [];
  let rowSums = [];
  let colSums = [];
  let cellColors = [];
  cells.forEach(({ row, col, val }) => {
    if (row === 1) {
      colVals[col] = val;
    } else {
      if (colSums[col] === undefined) {
        colSums[col] = val;
      } else {
        colSums[col] += val;
      }
    }
    if (cellColors[row] === undefined) {
      cellColors[row] = [];
    }
    if (col === 1) {
      rowVals[row] = val;
    } else {
      if (rowSums[row] === undefined) {
        rowSums[row] = val;
      } else {
        rowSums[row] += val;
      }
    }
    // const shapedTerms = shapeGridTermsByValue({ cells, terms });
    // const color = getGridCellColor({row, col, val, rowVals, colVals, terms: shapedTerms});
    cellColors[row][col] = "#fff"; //color;
  });
  const coloredCells = cells.map(cell => (
    {
      ...cell,
      readonly: cell.readonly,
      border: cell.col === 1 && cell.row === 1 && "border: 1px solid #ddd; border-right: 1px solid #aaa; border-bottom: 1px solid #aaa;" ||
        cell.col === 1 && "text-align: center; border: 1px solid #ddd; border-right: 1px solid #aaa;" ||
        cell.row === 1 && "text-align: center; border: 1px solid #ddd; border-bottom: 1px solid #aaa;" ||
        selection.anchor > cell.from && selection.anchor < cell.to &&
        `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 2px solid royalblue;` ||
        `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 1px solid #ddd;`,
      color: (cell.col === 1 || cell.row === 1) && "#fff" ||
        cell.background || "#fff"
    }
  ));
  console.log("coloredCells() coloredCells=" + JSON.stringify(coloredCells, null, 2));
  return applyDecoration({doc, cells: coloredCells});
}

const modelBackgroundPlugin = () => new Plugin({
  state: {
    init(_, state) {
      return applyModelRules(state);
    },
    apply(tr, decorationSet, oldState, newState) {
      tr = tr;
      oldState = oldState;
      newState = newState;
      decorationSet = decorationSet;
      return applyModelRules(newState);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

const getCells = doc => {
  const cells = [];
  let row = 0, col = 0;
  doc.descendants((node, pos) => {
    if (node.type.name === "table_row") {
      row++;
      col = 0;
    }
    if (node.type.name === "table_cell") {
      console.log("getCells() node=" + JSON.stringify(node, null, 2));
      col++;
      const val = node.textContent;
      let ast;
      try {
        ast = Parser.create({allowThousandsSeparator: true}, val);
      } catch (x) {
        console.log("parse error: " + x.stack);
      }
      cells.push({
        row,
        col,
        val,
        ast,
        from: pos,
        to: pos + node.nodeSize,
        justify: node.attrs.justify,
        background: node.attrs.background,
        fontWeight: node.attrs.fontWeight,
      });
    }
  });
  // console.log("getCells() cells=" + JSON.stringify(cells, null, 2));
  return cells;
};

const debouncedStateUpdate = debounce(({ state, editorState }) => {
  state.apply({
    type: "update",
    args: {editorState},
  });
}, 1000);

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'paragraph',
      cellAttributes: {
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
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

const plugins = [
  columnResizing(),
  tableEditing(),
  history(),
  keymap({"Mod-z": undo, "Mod-y": redo}),
  keymap({
    ...baseKeymap,
    Tab: goToNextCell(1),
    'Shift-Tab': goToNextCell(-1),
  }),
  menuPlugin,
];

let initEditorState = EditorState.create({
//  doc,
  schema,
  plugins,
    // .concat(
    //   exampleSetup({
    //     schema,
    //     menuContent: menu,
    //   }),
    // ),
});
const fix = fixTables(initEditorState);
if (fix) initEditorState = initEditorState.apply(fix.setMeta('addToHistory', false));

class ParagraphView {
  public dom;
  public contentDOM;
  private wasFocused;
  private wasBlurred;
  private value = "";
  private textContent = "";
  private hasFocus;
  constructor(node, view, getPos) {
    this.dom = document.createElement("div");
    this.dom.className = "custom-paragraph";
    this.contentDOM = document.createElement("p");
    this.dom.appendChild(this.contentDOM);
//    this.update(node);
    if (node.content.size == 0) this.dom.classList.add("empty")
    setInterval(() => {
      const selection = view.state.selection;
      const pos = getPos();
      if (!pos) return;
      const resolvedPos = view.state.doc.resolve(pos);
      const start = resolvedPos.start();
      const end = resolvedPos.end();
      if ((selection.head < start || selection.head > end) && this.hasFocus) {
        this.hasFocus = false;
        if (this.wasFocused) {
          this.update(resolvedPos.node(resolvedPos.depth).child(0));
          this.wasFocused = false;
        }
        if (!this.wasBlurred) {
          this.wasBlurred = true;
        }
      } else if (selection.head >= start && selection.head <= end && !this.hasFocus) {
        this.hasFocus = true;
        if (!this.wasFocused) {
//          this.update(resolvedPos.node(resolvedPos.depth).child(0));
          this.wasFocused = true;
        }
        if (this.wasBlurred) {
//          this.update(resolvedPos.node(resolvedPos.depth).child(0));
          this.wasBlurred = false;
        }
      }
    }, 1000);
  }
  update(node) {
    if (node.type.name !== "paragraph") {
      return false
    }
    if (node.content.size > 0) {
      this.dom.classList.remove("empty");
      if (this.hasFocus) {
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
  stopEvent() { return true }
}

export const TableEditor = ({ state }) => {
  const [ editorView, setEditorView ] = useState(null);
  const editorRef = useRef(null);
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const editorView = new EditorView(editorRef.current, {
      state: initEditorState,
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        debouncedStateUpdate({
          state,
          editorState: editorState.toJSON()
        });
      },
      nodeViews: {
        paragraph(node, view, getPos) { return new ParagraphView(node, view, getPos) }
      }
    });
    setEditorView(editorView);
    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  const { editorState } = state.data;
  useEffect(() => {
    if (editorView && editorState) {
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins: [
          columnResizing(),
          tableEditing(),
          history(),
          keymap({"Mod-z": undo, "Mod-y": redo}),
          keymap({
            ...baseKeymap,
            Tab: goToNextCell(1),
            'Shift-Tab': goToNextCell(-1),
          }),
          menuPlugin,
          modelBackgroundPlugin(),
        ]
      }, editorState);
//      console.log("editorState=" + JSON.stringify(editorState, null, 2));
//      console.log("newEditorState=" + JSON.stringify(newEditorState, null, 2));
      editorView.updateState(newEditorState);
      const cells = getCells(newEditorState.doc);
      const firstCell = cells.find(cell => cell.col === 2 && cell.row === 2);
      const pos = firstCell && firstCell.from + 1 || 0;
      if (!pos) return;
      const resolvedPos = newEditorState.doc.resolve(pos);
      editorView.dispatch(editorView.state.tr.setSelection(new TextSelection(resolvedPos)));
    }
  }, [editorView, editorState]);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white text-xs font-sans"
    />
  );
};
