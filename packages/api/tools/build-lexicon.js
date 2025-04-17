import { lexicon as baseLexicon } from "@graffiticode/basis";
import { lexicon as langLexicon } from "../src/lexicon.js";
const lexicon = {
  ...baseLexicon,
  ...langLexicon,
};
console.log(`export const lexicon = ${JSON.stringify(lexicon, null, 2)}`);
