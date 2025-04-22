# Graffiticode L0165 Vocabulary

This specification documents dialect-specific functions available in the
**L0165** language of Graffiticode. These functions extend the core language
with additional functionality tailored to L0165 use cases.

The core language specification including the definition of its syntax,
semantics and base library can be found here:
[Graffiticode Language Specification](./graffiticode-language-spec.html)

## Functions

| Function | Signature | Description |
| :------- | :-------- | :---------- |
| `table`  | `<record: record>` | Creates a table with given content |
| `cells`  | `<record record: record>` | Defines cell data and configurations |
| `rows`   | `<record record: record>` | Defines row data and configurations |
| `columns`| `<record record: record>` | Defines column data and configurations |
| `params` | `<record: record>` | Defines parameters for the table |

### table

Creates a table with cells.

```
table cells {...}
```

### cells

Defines cell content.

```
cells {...} {...}
```

### rows

Defines row attributes.

```
rows {...} {...}
```

### columns

Defines column attributes.

```
columns {...} {...}
```

### params

Defines parameter sets used to populate cells.

```
params {
  A1: "Fees earned",
  A2: "Office expense",
  A3: "Miscellaneous expense",
  A4: "Salary and wage expense",
  B1: "1485000..1585000:200000",
  B2: "325000..425000:25000",
  B3: "26000..30000:2000",
  B4: "875000..975000:50000",
}
```

## Program Examples

Create a 2 by 2 table assessment where the rows are sorted to match the
candidate's actual response.

```
table 
  rows {
    "*": {
      assess: {
        index: "B",
        order: "actual", | "expected", "asc", "desc"
      }
    }
  }
  columns {
    A: {
      width: 100,
      justify: "right",
    },
    B: {
      width: 100,
      justify: "left",
    },
  }
  cells {
    A1: {
      text: "{{A1}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A1}}"
        }
      },
    },
    A2: {
      text: "{{A2}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A2}}"
        }
      },
    },
    B1: {
      text: "{{B1}}",
    },
    B2: {
      text: "{{B2}}",
    },
  }
  params {
    A1: "100..200: 50",
    A2: "1000..2000: 500",
    B1: "pigs, chickens, cows",
    B2: "apples, oranges, bananas",
  }
..
```
