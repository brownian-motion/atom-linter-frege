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

      //TODO: load options
      let javaTarget = "1.7";
      let fregecJarPath = "$HOME/bin/fregec.jar";

      // let errorIndicatingNoLinterWarnings = new Error("no linter warnings");

      //lint with fregec -j <file>
      let exec = require("child_process").exec;
      let linterOutput = new Promise((resolve, reject) => {
        exec("java -jar "+fregecJarPath+" -target "+javaTarget+" -j \"" + editorPath +"\"", (err, stdout, stderr) => {
          // if(err){
            resolve(stderr); //no way to differentiate between linter output and shell errors... just gotta deal
          // } else {
            // reject(errorIndicatingNoLinterWarnings); //this is so that we don't try to process empty output
          // }
        });
      });

      //parse lint results
      let linterOutputLines = linterOutput.then((linterOutputText) => {
        return linterOutputText.split("\n").filter(val => (val !== null && val !== "")); //get rid of empty lines
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
  "test" : {
    "type" : "int",
    "default" : 5
  }
};

/**
 * Parses a single line of linter output.
 * If the line is valid, returns an linter-error object as follows:
 *  { type(String), text(String), range(Range object - array of arrays), filePath(String) }
 * Otherwise, returns null.
 */
function parseLinterLine(lineOfLinterOutput){
  var linterRegex = /^(\w+) (.+):(\d+): (.+)$/;
  var linterBits = linterRegex.exec(lineOfLinterOutput);
  if(linterBits === null || linterBits.length != 5)
    return null;
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
