let splitCheckBox = document.getElementById("splitCheckBox");
let splitRatioContainer = document.getElementById("splitRatioContainer");
let splitRatio = document.getElementById("splitRatio");
let fileInput = document.getElementById("fileInput");
let progressBar = document.getElementById("progressBar")

splitCheckBox.addEventListener("change", function () {
    if (splitCheckBox.checked) splitRatioContainer.style.visibility = "visible";
    else splitRatioContainer.style.visibility = "hidden";
})
splitCheckBox.dispatchEvent(new Event("change"))

fileInput.addEventListener("change", function () {
    merge(fileInput.files);
});

var input = './hantel/111hantel.csv';
var trainingOutput = './hantel/111train.csv';
var validationOutput = './hantel/111eval.csv';
var classesOutput = './hantel/111classes.csv';

var csvByImage = {};
let csvByVideo = {};



function merge(files) {
    let outputString = "";
    let fileIndex = 0;

    loadCsvFiles(files, fileIndex, outputString, function (outputString) {
        verify(outputString)
    })

}
function loadCsvFiles(files, fileIndex, outputString, cb) {
    let type = files[fileIndex].type.split('/')[0];

    progressBar.value = 0;
    progressBar.visibility = "visible";

    var fr = new FileReader();
    fr.onload = function () {
        fileIndex++;
        outputString += fr.result;
        progressBar.value = Math.round((fileIndex / files.length) * 100);
        if (fileIndex == files.length - 1) {
            progressBar.visibility = "hidden";
            cb(outputString)
        }
        else loadCsvFiles(files, fileIndex, outputString, cb)
    }

    if (type == "text") {
        fr.readAsText(files[fileIndex]);
    }
}

let outputLogDiv = document.getElementById("outputLog");
function verify(csv) {
    let outputLog = "";
    var csv = csv.split(/\r?\n/);

    for (var i = 0; i < csv.length; i++) {
        if (csv[i] == "") continue;
        var data = csv[i].split(',');
        var imgPath = 0;
        var x1 = 1;
        var y1 = 2;
        var x2 = 3;
        var y2 = 4;
        var klasse = 5;

        data[x1] = parseInt(data[x1]);
        data[y1] = parseInt(data[y1]);
        data[x2] = parseInt(data[x2]);
        data[y2] = parseInt(data[y2]);


        let videoNameEnd = data[imgPath].lastIndexOf("_");
        let video = data[imgPath].substring(0, videoNameEnd);

        if (data[x1] == data[x2] || data[y1] == data[y2]) {
            csv.splice(i, 1);
            outputLog += "Removed line " + (i + 1) + " (zero area)" + ": " + data + "\n";
            continue;
        }

        var flipped = false;
        var old = data.toString();
        if (data[x1] > data[x2]) {
            var oldX1 = data[x1];
            data[x1] = data[x2];
            data[x2] = oldX1;
            // console.log(data[x1], data[x2])
            flipped = true;
        }
        if (data[y1] > data[y2]) {
            var oldy1 = data[y1];
            data[y1] = data[y2];
            data[y2] = oldy1;
            flipped = true;
        }
        if (flipped) {
            outputLog += "Flipped line " + (i + 1) + ": " + old + "\n"
            outputLog += "       New line: " + data + "\n";
        }
        //csv[i] = data.toString();


        // if (!csvByImage[data[imgPath]]) csvByImage[data[imgPath]] = [];
        // csvByImage[data[imgPath]].push(data.toString());

        if (!csvByVideo[video]) csvByVideo[video] = [];
        csvByVideo[video].push(data.toString());
    }

    var videoCount = Object.keys(csvByVideo).length;

    var split = 1;
    if (splitCheckBox.checked) split = splitRatio.value;
    var trainCount = Math.round(videoCount * split);
    var evalCount = Math.round(videoCount * (1 - split));

    outputLog += "=======================\n"
    outputLog += "Found " + videoCount + " valid videos, splitting into " + trainCount + " training and " + evalCount + " validating videos" + '\n';

    var trainCsv = [];
    var evalCsv = [];

    for (var i = 0; i < evalCount; i++) {
        var selected = Math.round(Math.random() * (videoCount - 1));

        var selectedVideo = Object.keys(csvByVideo)[selected];


        evalCsv.push(csvByVideo[selectedVideo].join('\n'));
        delete csvByVideo[selectedVideo];

        videoCount--;
    }
    for (var j = 0; j < videoCount; j++) {
        var selectedVideo = Object.keys(csvByVideo)[j];
        trainCsv.push(csvByVideo[selectedVideo].join('\n'))
    }

    outputLogDiv.innerText = outputLog;

    // saveFile(trainingOutput, trainCsv.join('\n'));
    // saveFile(validationOutput, evalCsv.join('\n'));


    console.log("Training data: " + trainCsv.length + " videos, saved to " + trainingOutput);
    console.log("Evaluation data: " + evalCsv.length + " videos, saved to " + validationOutput);

    if (split != 1) getClasses(trainCsv, evalCsv);
    // console.log(evalCsv.toString())


}

function getClasses(train, eval) {

    var trainCsv = [];
    var evalCsv = [];
    for (var l = 0; l < train.length; l++) {
        var entries = train[l].split(/\r?\n/);
        trainCsv = trainCsv.concat(entries);
    }
    for (var n = 0; n < eval.length; n++) {
        var entries = eval[n].split(/\r?\n/);
        evalCsv = evalCsv.concat(entries);
    }

    var trainClasses = {};
    for (var i = 0; i < trainCsv.length; i++) {
        if (!trainClasses[trainCsv[i].split(',')[5]]) trainClasses[trainCsv[i].split(',')[5]] = 0;
        trainClasses[trainCsv[i].split(',')[5]]++;
    }

    var evalClasses = {};
    for (var j = 0; j < evalCsv.length; j++) {
        if (!evalClasses[evalCsv[j].split(',')[5]]) evalClasses[evalCsv[j].split(',')[5]] = 0;
        evalClasses[evalCsv[j].split(',')[5]]++;
    }

    var allClasses = {};
    for (var key1 in trainClasses) {
        if (!allClasses[key1]) allClasses[key1] = 0;
        allClasses[key1] += trainClasses[key1];
    }
    for (var key2 in evalClasses) {
        if (!allClasses[key2]) allClasses[key2] = 0;
        allClasses[key2] += evalClasses[key2];
    }
    console.log();
    console.log("Split per classes: ")
    var classes = Object.keys(allClasses);
    var classesFile = "";

    //sort alphabetically so its always the same:
    classes.sort();

    for (var k = 0; k < classes.length; k++) {
        classesFile += classes[k] + ',' + k + '\n';

        var classTrain = trainClasses[classes[k]]
        var classEval = evalClasses[classes[k]];
        var classSplit = classTrain / allClasses[classes[k]];
        classSplit = Math.round(classSplit * 10000) / 100
        console.log(classes[k] + ": " + classSplit + "% (" + classTrain + "|" + classEval + ")")
    }
    //saveFile(classesOutput, classesFile)
}

function saveFile(content, name) {
    var a = document.createElement("a");
    a.download = name;
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    a.click();
}