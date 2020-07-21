fs = require('fs');
fs.readFile("./test_labels.csv", 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    data = data.split('\n')
    let images = {};
    for (let i = 1; i < data.length; i++) {
        let pic = data[i].split(",")[0];
        let exists = images[pic] != undefined;
        if (exists) images[pic]++;
        else images[pic] = 1;
    }
    // imageCount = 0;
    // Object.keys(images).forEach(function (key) {
    //     imageCount += images[key];
    // });
    console.log(Object.keys(images).length + " indiviual images")
});

