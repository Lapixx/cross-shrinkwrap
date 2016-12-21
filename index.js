#!/usr/bin/env node

const glob = require("glob");
const path = require("path");
const fs = require("fs");

const makecb = (resolve, reject) => (err, res) => err ? reject(err) : resolve(res);
const wrapPromise = fn => new Promise((resolve, reject) => fn(makecb(resolve, reject)));

const release = (err) => setImmediate(() => { throw err; });

const localPath = fname => path.join(process.cwd(), fname);
const requireLocal = fname => require(localPath(fname));

const cleanDeps = (deps, isDirty) =>
    Object.keys(deps).reduce((result, depName) => {
        if (isDirty(depName))
            return result;

        result[depName] = deps[depName];

        // clean sub dependencies
        if (deps[depName].dependencies)
            result[depName].dependencies = cleanDeps(deps[depName].dependencies, isDirty);

        return result;
}, {});

wrapPromise(cb => glob("./node_modules/**/package.json", cb))
.then(packages => {

    const platformSpecifics = packages.map(pkg => {
        const pkgInfo = requireLocal(pkg);
        const shouldFilter = typeof pkgInfo.os !== "undefined";
        return shouldFilter ? pkgInfo.name : null;
    }).filter(x => x !== null);

    return platformSpecifics;
})
.then(blacklist => {

    const isBlacklisted = name => blacklist.includes(name);
    const wrap = requireLocal("npm-shrinkwrap.json");
    const cleanedDeps = cleanDeps(wrap.dependencies, isBlacklisted);
    wrap.dependencies = cleanedDeps;

    const data = JSON.stringify(wrap, null, 2);
    return wrapPromise(cb => fs.writeFile(localPath("npm-shrinkwrap.json"), data, cb))
    .then(() => {
        if (blacklist.length > 0) {
            console.log("Filtered " + blacklist.length + " dependencies from shrinkwrap:");
            console.log(" - " + blacklist.join("\n - ") + "\n");
        }
        else {
            console.log("No dependencies were removed");
        }
        process.exit(0);
    });
})
.catch(release);
