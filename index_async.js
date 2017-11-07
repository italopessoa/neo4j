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
    fs.writeFile(fileName, JSON.stringify({
        values: []
    }), 'utf8');
}

function save(json, fileName) {
    fs.readFile(fileName, 'utf8', function readFileCallback(err, data) {
        const obj = JSON.parse(data);
        obj.values = json;
        fs.writeFile(fileName, JSON.stringify(obj), 'utf8');
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
async function getUsers(x) {
    let json = {};
    if (x > 1) {
        json = await (await fetch(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}&offset=${x*25}`, options)).json();
    } else {
        json = await (await fetch(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}`, options)).json();
    }

    var a = [];
    json.results.comments.forEach(item => {
        const createDate = new Date(item.createDate * 1000);
        const createDateString = `${createDate.getDay()+1}/${createDate.getMonth()+1}/${createDate.getFullYear()}`;
        if (userComments.filter(u => u.userID == item.userID && u.assetID == item.assetID).length === 0) {
            userComments.push({
                user: item.userID,
                asset: item.assetID,
            });
        }
    });
}

async function init() {
    for (var index = 1; index < 12; index++) {
        console.log('buscando usuarios')
        await getUsers(index);
    }
    createDataFile('comments2.json');
    save(userComments, 'comments2.json');
    console.log('fim')
}

init();
process.on('unhandledRejection', (err) => {
    console.error(err)
    process.exit(1)
})