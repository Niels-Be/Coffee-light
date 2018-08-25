const UglifyES = require("uglify-es");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

const inputDir  = "public/";
const outputDir = "public_build/";

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

function minifyFile(fileName) {
    let fileNameWithoutInputDir = fileName.substring(inputDir.length);
    let code = fs.readFileSync(fileName, "utf8");
    let input = {};
    input[fileNameWithoutInputDir] = code;

    let options = {};
    options.sourceMap = {
        filename: fileNameWithoutInputDir,
        url: fileNameWithoutInputDir + ".map"
    };

    let min = UglifyES.minify(input);
    code = min.code;
    if(code == undefined) {
        console.log(fileName, min);
    }

    fs.writeFileSync(outputDir + fileNameWithoutInputDir, code, "utf-8");
}

glob.sync(inputDir + "*.js").forEach(file => minifyFile(file));