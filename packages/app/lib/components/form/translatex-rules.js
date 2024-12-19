export const evalRules = {
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
          "\\type{fn}(\\type{cellRange})": "$fn",
          "?+?": "$add",
          "?-?": "$minus",
          "?*?": "$multiply",
          "?/?": "$divide"
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
