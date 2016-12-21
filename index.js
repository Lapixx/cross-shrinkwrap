#!/usr/bin/env node

const glob = require("glob");
const path = require("path");

const makecb = (resolve, reject) => (err, res) => err ? reject(err) : resolve(res);
const promisify = fn => (...args) => new Promise((resolve, reject) => fn(...args, makecb(resolve, reject)));

const release = (err) => setImmediate(() => { throw err; });

const localPath = fname => path.join(process.cwd(), fname);
const requireLocal = fname => require(localPath(fname));

promisify(glob)("./node_modules/**/package.json")
.then(packages => {

    const platformSpecifics = packages.map(pkg => {
        const pkgInfo = requireLocal(pkg);
        const shouldFilter = typeof pkgInfo.os === "undefined";
        return shouldFilter ? pkgInfo.name : null;
    }).filter(x => x !== null);

    return platformSpecifics;
})
.then(blacklist => {
    const isBlacklisted = name => blacklist.includes(name);
    const wrap = requireLocal("npm-shrinkwrap.json");
    const cleanedDeps = cleanDeps(wrap.dependencies, isBlacklisted);
    return { ...wrap, dependencies: cleanedDeps };
})
.then(cleanedWrap => {
    const data = JSON.stringify(cleanedWrap);
    fs.writeFile(localPath("npm-shrinkwrap.json"), data);
})
.then(() => process.exit(0))
.catch(release);