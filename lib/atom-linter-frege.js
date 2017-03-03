'use babel';

export function activate() {
  // Fill something here, optional
}

export function deactivate() {
  // Fill something here, optional
}

export function provideLinter() {
  return {
    name: 'Example',
    scope: 'file', // or 'project'
    lintsOnChange: false, // or true
    grammarScopes: ['source.frege', 'source.fr'],
    lint(textEditor) {
      const editorPath = textEditor.getPath();

      //load options
      let javaTarget = atom.config.get("atom-linter-frege.javaTarget");
      let fregecJarPath = atom.config.get("atom-linter-frege.fregecJarPath");

      // let errorIndicatingNoLinterWarnings = new Error("no linter warnings");

      //lint with fregec -j <file>
      let exec = require("child_process").exec;
      let command = "java -jar \""+fregecJarPath+"\" -target "+javaTarget+" -j \"" + editorPath +"\"";
      let linterOutput = new Promise((resolve, reject) => {
        console.log("Executing "+command);
        exec(command, (err, stdout, stderr) => {
          // if(err){
            resolve(stderr); //no way to differentiate between linter output and shell errors... just gotta deal
          // } else {
            // reject(errorIndicatingNoLinterWarnings); //this is so that we don't try to process empty output
          // }
        });
      });

      /**
       * Returns true if val does not represent the absence of data;
       * that is, null, undefined, empty array, or empty string.
       * 0 and false are considered non-empty.
       */
      function isNotEmpty(val){
        return (val !== null && val !== "" && val !== undefined && val !== []);
      }

      //parse lint results
      let linterOutputLines = linterOutput.then((linterOutputText) => {
        return breakIndentedLinterOutputIntoLines(linterOutputText).filter(isNotEmpty); //get rid of empty lines
      });

      //get results as an array using map()
      let linterResults = linterOutputLines.then((linterOutputLineArray) => {
        return linterOutputLineArray.map(parseLinterLine);
      });

      // Note, a Promise may be returned as well!

//we return the promise created after handling the possibility of no linting output
      return (linterResults
        .then((linterOutputLineArray)=>{
          console.log(linterOutputLineArray);
          return linterOutputLineArray;
        })
        // .catch((err) => {
        //   console.log("Error linting: "+err);
        //   if(err !== errorIndicatingNoLinterWarnings){
        //     throw err;
        //   }
        // })
      );
    }
  };
}

export var config = {
  "javaTarget" : {
    "type" : "string",
    "default" : "1.8",
    "description" : "The target version of Java"
  },

  "fregecJarPath": {
    "type": "string",
    "default" : "$HOME/bin/fregec.jar",
    "description" : "The path to the JAR file of your version of Frege. Paths cannot include ~"
  }
};

/**
 * Parses a single line of linter output.
 * If the line is valid, returns an linter-error object as follows:
 *  { type(String), text(String), range(Range object - array of arrays), filePath(String) }
 * Otherwise, throws an exception, so we don't hide reporting real errors
 */
function parseLinterLine(lineOfLinterOutput){
  var linterRegex = /^(\w+) (.+):(\d+): (.+)$/;
  var linterBits = linterRegex.exec(lineOfLinterOutput);
  if(linterBits === null || linterBits.length != 5){
    let message = "Weird linter results: '"+lineOfLinterOutput+"', parsed as "+linterBits;
    console.log(message);
    throw new Error(message);
  }
  var lineNum = parseInt(linterBits[3])-1;//lines are 0-indexed
  return {
    type: parseLinterMessageType(linterBits[1]),
    filePath: linterBits[2],
    range: [[lineNum],[lineNum]],
    text: linterBits[4]
  };
}

/**
 * Determines what type of linter message to report to Atom based on the characters
 * at the start of a line of Frege's litner output.
 * 'E', for example, returns 'Error'
 */
function parseLinterMessageType(messageType){
  if(messageType == 'E')
    return "Error";
  else if(messageType == "W")
    return "Warning";
  else
    return messageType;
}

function breakIndentedLinterOutputIntoLines(linterOutput){
  const isLineIndentedRegexp = /^\s/;
  var rawLines = linterOutput.split("\n");
  if(rawLines.length === 0)
    return [];
  var resultLines = [];
  var currentLine = rawLines[0];
  for(var i = 1 ; i < rawLines.length ; i++){
    if(isLineIndentedRegexp.test(rawLines[i])){
      currentLine += " " + rawLines[i].trim();
    } else {
      resultLines.push(currentLine);
      currentLine = rawLines[i];
    }
  }
  resultLines.push(currentLine);

  return resultLines;
}
