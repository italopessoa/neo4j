#!/usr/bin/env node

const fetch = require("node-fetch");
const fs = require('fs');

let count = 1;
var options = {
    method: "GET",
    headers: {
        "api-key": "",
    }
};

let userComments = [];
let assets = [];



function createDataFile(fileName) {
    fs.writeFile(fileName, JSON.stringify([]), 'utf8');
}

function save(json, fileName) {
    console.log(json);
    fs.readFile(fileName, 'utf8', function readFileCallback(err, data) {
        const obj = JSON.parse(data); //now it an object
        obj.push(json); //add some data
        // console.log(obj)
        fs.writeFile(fileName, JSON.stringify(obj), 'utf8'); // write it back 
    });
}

function readComments(json) {
    setTimeout(() => {
        if (json.status === 'OK' && json.results.comments.length > 0) {
            json.results.comments.forEach(comment => {
                const createDate = new Date(comment.createDate * 1000);
                const createDateString = `${createDate.getDay()+1}/${createDate.getMonth()+1}/${createDate.getFullYear()}`;
                if (userComments.filter(e => e.user == comment.userID /* && e.asset == comment.assetID*/ ).length == 0) {
                   // console.log(comment.userID);
                    userComments.push({
                        user: comment.userID,
                        asset: comment.assetID,
                        createDate: createDateString,
                    });
                    save({
                        user: comment.userID,
                        asset: comment.assetID,
                        createDate: createDateString,
                    }, 'teste.json')
                }
                if (assets.filter(e => e.id == comment.assetID).length == 0) {
                    // console.log({
                    //     // id: comment.assetID,
                    //     url: comment.assetURL,
                    // });
                    assets.push({
                        id: comment.assetID,
                        url: comment.assetURL,
                    });
                }
            });
        }
    }, 1000);
}
createDataFile('teste.json');
let xAux = 0;
while (count < 12) {
    setTimeout(() => {
        let x = ++xAux;
        // console.log(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}&offset=${(x-1)*25}`)
        // console.log('consulta: ' + x);
        fetch(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}&offset=${(x-1)*25}`, options)
            .then(response => {
                response.json().then(json => {
                        readComments(json);
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    }, 1000 * ++count);
}
console.log('fim')