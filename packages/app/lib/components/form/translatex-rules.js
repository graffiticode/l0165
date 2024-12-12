export const rules = {
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
    "$?": [
      "%2"
    ],
    "=?": [
      {
        "%2": {
          "\\type{fn}(\\type{cellRange})": "$fn"
        }
      }
    ],
    "\\type{cellRange}": [
      "$range"
    ],
    "\\type{cellName}": [
      "$cell"
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
