#!/usr/bin/env node

const fetch = require("node-fetch");
const request = require("request");
const fs = require('fs');
var sleep = require('thread-sleep');

let count = 1;
var options = {
    method: "GET",
    headers: {
        "api-key": "1fffcfce26174fb3bf11c6071b6af4da",
    }
};

let userComments = [];

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
let users = [];
let assets = [];
let keywords = [];
const addAsset = (asset) => {
    if (assets.filter(a => a.assetID == asset.assetID).length === 0) {
        if (asset.url.indexOf("www.nytimes.com") >= 0) {
            assets.push(asset);
        }
    }
}

async function getUsers(x) {
    let json = {};
    if (x > 1) {
        json = await (await fetch(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}&offset=${x * 25}`, options)).json();
    } else {
        json = await (await fetch(`http://api.nytimes.com/svc/community/v3/user-content/by-date.json?date=2015-${x}-${x}`, options)).json();
    }

    json.results.comments.forEach(item => {
        const createDate = new Date(item.createDate * 1000);
        const createDateString = `${createDate.getDay() + 1}/${createDate.getMonth() + 1}/${createDate.getFullYear()}`;
        if (userComments.filter(u => u.userID == item.userID).length === 0) {
            users.push({
                userID: item.userID,
                userName: item.userDisplayName,
                comments: [],
            });
        }
        addAsset({
            assetID: item.assetID,
            url: item.assetURL,
            snippet: '',
            headline: '',
            keywords: []
        });
    });
}

async function getUserComments(userID) {
    for (let x = 0; x < 1; x++) {
        let json = await (await fetch(`http://api.nytimes.com/svc/community/v3/user-content/user.json?userID=${userID}&offset=${x * 25}`, options)).json();
        json.results.comments.forEach(item => {
            const createDate = new Date(item.createDate * 1000);
            const createDateString = `${createDate.getDay() + 1}/${createDate.getMonth() + 1}/${createDate.getFullYear()}`;
            const userIndex = users.findIndex(u => u.userID === item.userID);
            let user = users[userIndex];
            const commentIndex = user.comments.findIndex(c => c.assetID === item.asset.assetID);
            if (commentIndex >= 0) {
                user.comments[commentIndex].times = user.comments[commentIndex].times + 1;
            }
            else {
                user.comments.push({ assetID: item.asset.assetID, times: 1 });
                addAsset({
                    assetID: item.asset.assetID,
                    url: item.asset.assetURL,
                    snippet: '',
                    headline: '',
                    keywords: []
                });
            }
            users[userIndex] = user;
        });
    }
}
const isHttps = url => url.substring(4, 5) === "s";
async function urlExists(url) {
    options = { method: 'HEAD', url: url },
        req = http.request(options, function (r) {
            console.log(JSON.stringify(r.headers));
        });
    req.end();
}
async function getAssetsDetail() {
    for (var a in assets) {
        let asset = assets[a];
        asset.url = asset.url.replace('http://', 'https://');
        let url = `http://api.nytimes.com/svc/search/v2/articlesearch.json?fq=web_url:"${asset.url}"`;
        let json = await (await fetch(url, options)).json();
        if (json.response.docs.length > 0) {
            asset.snippet = json.response.docs[0].snippet;
            asset.headline = json.response.docs[0].headline.main;
            json.response.docs[0].keywords.forEach(k => {
                if (asset.keywords.findIndex(key => key == k.value) === -1) {
                    asset.keywords.push(k.value);
                }
            });
        }
        sleep(800);
    }
}

function removeFile(fileName) {
    fs.unlink(fileName, (err) => {
        if (err) console.log(`arquivo ${fileName} nao existe`);
        console.log(`arquivo ${fileName} removido`);
    });
}
//1451617200 01-01-2016 limite
async function init(test) {
    if (!test) {
        for (var index = 1; index < 4; index++) {
            console.log('buscando usuarios')
            await getUsers(index);
        }
    }
    // await getUserComments(users[0].userID);
    await getAssetsDetail();
    fs.writeFile('users.json', JSON.stringify(users, null, 2), 'utf8');
    fs.writeFile('assets.json', JSON.stringify(assets, null, 2), 'utf8');
    console.log('fim')
}

if (process.argv[2] != undefined && process.argv[2] === `test`) {
    assets = JSON.parse((fs.readFileSync('assets.json', 'utf8')));
    users = JSON.parse((fs.readFileSync('users.json', 'utf8')));
    init(true);
} else {
    removeFile('assets.json');
    removeFile('users.json');
    init(false);
}

process.on('unhandledRejection', (err) => {
    console.error(err)
    process.exit(1)
})