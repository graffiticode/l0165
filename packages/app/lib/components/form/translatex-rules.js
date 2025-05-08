export const evalRules = {
  "types": {
    "args": [
      "\\type{cellName}:\\type{cellName}",
      "?,?"
    ],
    "cellName": [
      "\\type{variable}\\type{integer}"
    ],
    "cellRange": [
      "\\type{cellName}:\\type{cellName}"
    ],
    "fn": [
      "sum",
      "mul",
      "round"
    ]
  },
  "rules": {
    "=\\type{cellName}": [
      "$cell"
    ],
    "=?": [
      {
        "%2": {
          "\\type{fn}(\\type{args})": "$fn",
          "\\type{fn}(?,?)": "$fn",
          "\\type{fn}(?)": "$fn",
          "?+?": "$add",
          "?-?": "$minus",
          "?*?": "$multiply",
          "?/?": "$divide",
          "?%": "$percent",
          "-?": "$minus"
        }
      }
    ],
    "\\type{cellRange}": [
      "$range"
    ],
    "\\type{args}": [
      "%1,%2"
    ],
    "\\type{cellName}": [
      "%1%2"
    ],
    "\\type{fn}(\\type{cellRange})": [
      "%1(%2)"
    ],
    "??": [
      "%1%2"
    ],
    "{{var:\\type{cellName}}}": [
      "{{var:%2}}"
    ],
    "?": [
      "%1"
    ]
  }
};

export const cellNameRules = {
  "types": {
    "cellName": [
      "\\type{variable}\\type{integer}"
    ],
    "cellRange": [
      "\\type{cellName}:\\type{cellName}"
    ],
    "fn": [
      "sum",
      "mul"
    ]
  },
  "rules": {
    "\\type{cellName}": [
      "%1%2"
    ],
    "=?": [
      {
        "%2": {
          "\\type{fn}(\\type{cellRange})": "%2",
          "?+?": "%1,%2",
          "?-?": "%1,%2",
          "?*?": "%1,%2",
          "?/?": "%1,%2",
          "\\type{cellName}": "%1%2"
        }
      }
    ],
    "\\type{cellRange}": [
      "$range"
    ],
    "??": [
      "%1%2"
    ],
    "?": [
      "%1"
    ]
  },
}

export const formatRules = {
  "rules": {
    "??": [
      "%1%2"
    ],
    "\\type{number}": [
      "$fmt"
    ],
    "-?": [
      "-%1"
    ],
    "?": [
      "%1"
    ]
  },
}

export const normalizeRules = {
  "types": {
    "cellName": [
      "\\type{variable}\\type{integer}"
    ],
    "cellRange": [
      "\\type{cellName}:\\type{cellName}"
    ],
    "fn": [
      "sum",
      "mul"
    ]
  },
  "rules": {
    "=\\type{cellName}": [
      "$cell"
    ],
    "=?": [
      {
        "%2": {
          "\\type{cellRange}": "%1:%2",
          "\\type{fn}(\\type{cellRange})": "$normalize",
          "?+?": "$normalize {\"acc\": [\"SUM\"]}",
          "?-?": "$normalize {\"acc\": [\"SUB\"]}",
          "?*?": "$normalize {\"acc\": [\"MUL\"]}",
          "?/?": "$normalize {\"acc\": [\"DIV\"]}",
          "?%": "$percent",
          "-?": "$minus"
        }
      }
    ],
    "\\type{cellRange}": [
      "$range"
    ],
    "\\type{cellName}": [
      "%1%2"
    ],
    "\\type{fn}(\\type{cellRange})": [
      "%1(%2)"
    ],
    "??": [
      "%1%2"
    ],
    "?": [
      "%1"
    ]
  },
}
