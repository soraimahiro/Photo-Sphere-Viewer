#!/usr/bin/env node

/**
 * Deploys a folder to Netlify
 */

import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import Queue from 'queue';

(async () => {
    // --branch (optional)
    // --rootFolder
    // --functionsFolder (unsupported)
    // --exclude (optional)
    const config = yargs(process.argv).argv;

    if (!process.env.NETLIFY_AUTH_TOKEN) {
        throw 'Missing env variable NETLIFY_AUTH_TOKEN';
    }
    if (!process.env.NETLIFY_SITE_ID) {
        throw 'Missing env variable NETLIFY_SITE_ID';
    }
    if (!config.rootFolder) {
        throw 'Missing --rootFolder';
    }

    if (!existsSync(config.rootFolder)) {
        throw `Folder ${config.rootFolder} does not exist`;
    }

    if (config.branch === 'main') {
        config.branch = null;
    }

    const files = await listFilesWithHashes(config.rootFolder, config.exclude, 'sha1');
    // TODO zip functions
    const functions = {};// await listFilesWithHashes(config.functionsFolder, null, 'sha256');

    const deploy = await createDeploy(config.branch, files, functions);

    await uploadFiles(config.rootFolder, files, deploy);
    // await uploadFunctions(config.functionsFolder, functions, deploy);

    if (!config.branch) {
        await publishDeploy(deploy);
    }

    if (process.env.CI) {
        exec(`echo "deploy_url=${config.branch ? deploy.deploy_ssl_url : deploy.ssl_url}" >> $GITHUB_OUTPUT`);
    }
})();

/**
 * List all files in a directory and compute each SHA256
 */
async function listFilesWithHashes(dir, exclude, hashfn) {
    const files = (await readdir(dir, { recursive: true, withFileTypes: true }))
        .filter(entry => entry.isFile())
        .map(entry => path.join(entry.parentPath ?? entry.path, entry.name).replace(/\\/g, '/'))
        .filter(file => !exclude || !file.includes(exclude));

    console.log(`${files.length} in ${dir}`);

    const queue = new Queue({
        concurrency: 5,
        results: [],
    });

    files.forEach(file => {
        queue.push(cb => {
            const input = createReadStream(file);

            const hash = createHash(hashfn);
            hash.setEncoding('hex');

            input.on('end', () => {
                hash.end();
                cb(null, file.replace(new RegExp(`^${dir}/`), ''), hash.read());
            });

            input.on('error', (err) => {
                hash.end();
                cb(err);
            });

            input.pipe(hash);
        });
    });

    return new Promise((resolve, reject) => {
        queue.start((err, results) => {
            if (err) {
                reject(err);
            } else {
                const filesHashes = results.reduce((res, [file, hash]) => {
                    res[file] = hash;
                    return res;
                }, {});
                resolve(filesHashes);
            }
        });
    });
}

/**
 * Creates a new deployment on Netlify
 */
async function createDeploy(branch, files, functions) {
    const result = await fetch(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}/deploys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.NETLIFY_AUTH_TOKEN,
        },
        body: JSON.stringify({
            branch,
            files,
            functions: Object.entries(functions).reduce((res, [name, hash]) => ({
                ...res,
                [name.replace('.zip', '')]: hash,
            }), {}),
        }),
    });

    const deploy = await result.json();

    console.log(`Created deploy #${deploy.id} (${deploy.deploy_ssl_url}). ${deploy.required.length} new files.`)

    return deploy;
}

/**
 * Publish the deploy
 */
async function publishDeploy(deploy) {
    const result = await fetch(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}/deploys/${deploy.id}/restore`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.NETLIFY_AUTH_TOKEN,
        },
    });

    deploy = await result.json();

    console.log(`Published deploy #${deploy.id} (${deploy.ssl_url}).`)
}

/**
 * Upload new files to Netlify
 */
async function uploadFiles(dir, files, deploy) {
    if (!deploy.required.length) {
        return;
    }

    const fileByHash = {};
    Object.entries(files).forEach(([file, hash]) => fileByHash[hash] = file);

    const queue = new Queue({
        concurrency: 5,
        results: [],
    });

    deploy.required.forEach(hash => {
        queue.push(cb => {
            const file = fileByHash[hash];

            console.log(`Upload ${file}`);

            fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${encodeURIComponent(file)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': 'Bearer ' + process.env.NETLIFY_AUTH_TOKEN,
                },
                body: createReadStream(path.join(dir, file)),
                duplex: 'half',
            })
                .then(() => cb(null))
                .catch(err => cb(err));
        });
    });

    return new Promise((resolve, reject) => {
        queue.start((err) => {
            err ? reject(err) : resolve();
        });
    });
}

/**
 * Upload new functions to Netlify
 */
async function uploadFunctions(dir, functions, deploy) {
    if (!deploy.required_functions.length) {
        return;
    }

    const functionsByHash = {};
    Object.entries(functions).forEach(([file, hash]) => functionsByHash[hash] = file);

    const queue = new Queue({
        concurrency: 5,
        results: [],
    });

    deploy.required_functions.forEach(hash => {
        queue.push(cb => {
            const fctn = functionsByHash[hash];

            fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/functions/${fctn.replace('.zip', '')}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': 'Bearer ' + process.env.NETLIFY_AUTH_TOKEN,
                },
                body: createReadStream(path.join(dir, fctn)),
                duplex: 'half',
            })
                .then(() => cb(null))
                .catch(err => cb(err));
        });
    });

    return new Promise((resolve, reject) => {
        queue.start((err) => {
            err ? reject(err) : resolve();
        });
    });
}
