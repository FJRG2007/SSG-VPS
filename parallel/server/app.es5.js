/*

Updates: https://github.com/FJRG2007/SSG-VPS/blob/main/parallel/server/app.es5.js

Functionalities ->
 - Clean Urls.
 - Route control.
 - Faster redirections.
 - Error handling.

*/

const fs = require("fs");
const { JSDOM } = require("jsdom");
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const outputFilePath = path.join(__dirname, "redirects.json");
var adapter = {
    contentDir: [__dirname, ".."]
};

const getTech = () => {
    switch (process.argv[2]) {
        case "--astro":
            adapter.routes = ["_astro"];
            adapter.contentDir.push("dist");
            console.log("\x1b[32m%s\x1b[0m", "[SERVER] All ready for you.");
            break;
        case "--native":
            adapter.routes = ["assets", "public"];
            adapter.contentDir.push("dist");
            console.log("\x1b[32m%s\x1b[0m", "[SERVER] All ready for you.");
            break;
        case "--starlight":
            adapter.routes = ["_astro", "pagefind"];
            adapter.contentDir.push("dist");
            console.log("\x1b[32m%s\x1b[0m", "[SERVER] All ready for you.");
            break;
        case "--vite":
            adapter.routes = ["assets"];
            adapter.contentDir.push("dist");
            console.log("\x1b[34m%s\x1b[0m", "[SERVER] Remember to set the property 'cleanUrls: true' in your Vite configuration file.");
            break;
        case "--vitepress":
            adapter.routes = ["assets"];
            adapter.contentDir.push(".vitepress", "dist");
            console.log("\x1b[34m%s\x1b[0m", "[SERVER] Remember to set the property 'cleanUrls: true' in your Vite configuration file.");
            break;
        default:
            adapter.routes = ["assets", "public"];
            adapter.contentDir.push("dist");
            console.log("\x1b[31m%s\x1b[0m", "[SERVER] You have not specified any technology, the server may not work as expected.");
            break;
    }
};

// Function for scanning HTML files in a directory, excluding certain folders.
const scanHtmlFiles = (dirPath, excludeDirs) => {
    const files = fs.readdirSync(dirPath);
    const redirects = {};
    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!excludeDirs.includes(file)) Object.assign(redirects, scanHtmlFiles(filePath, excludeDirs));
        } else if (path.extname(file) === ".html") {
            const dom = new JSDOM(fs.readFileSync(filePath, "utf8"));
            const metaRefresh = dom.window.document.querySelector('meta[http-equiv="refresh"]');
            if (metaRefresh) {
                const match = metaRefresh.getAttribute("content").match(/^0;url=(.*)$/);
                if (match) {
                    let relativePath = path.relative(...adapter.contentDir, filePath).replace(/\\/g, "/");
                    // If the path ends in index.html, replace it with * to handle redirects without index.html.
                    if (relativePath.endsWith("index.html")) relativePath = `${relativePath.slice(0, -10)}*`;
                    // If the path contains .html, replace it with * to handle redirects without .html.
                    if (relativePath.includes(".html")) relativePath = relativePath.replace(".html", "*");
                    redirects[`/${relativePath}`] = match[1];
                }
            }
        }
    });
    return redirects;
};

// Generate JSON file with redirects.
const generateRedirectsFile = () => {
    fs.writeFileSync(outputFilePath, JSON.stringify(scanHtmlFiles(...adapter.contentDir, adapter.routes), null, 2));
    console.log(`Generated redirection file: ${outputFilePath}`);
};

let redirectMap = {};
if (fs.existsSync(outputFilePath)) redirectMap = JSON.parse(fs.readFileSync(outputFilePath, "utf8"));
app.use((req, res, next) => {
    let reqPath = "";
    if (req.path.endsWith("/index.html")) {
        reqPath = `${req.path.slice(0, -10)}*`;
    } else if (req.path.endsWith(".html")) {
        reqPath = `${req.path.slice(0, -5)}`;
    } else if (req.path.endsWith("/")) {
        reqPath = `${req.path}*`;
    } else {
        reqPath = `${req.path}/*`;
    }
    if (redirectMap[reqPath]) return res.redirect(redirectMap[reqPath]);
    return next();
});

app.get("*", (req, res) => {
    const urlPath = req.url.split("?")[0];
    if (adapter.routes.some(r => urlPath.startsWith(r))) return res.sendFile(path.join(...adapter.contentDir, urlPath));
    // Check if the request URL ends with "index.html".
    if (urlPath.endsWith("index.html")) return res.redirect(urlPath.slice(0, -10));
    // Check if the request URL ends with ".html".
    if (urlPath.endsWith(".html")) return res.redirect(urlPath.slice(0, -5));
    // Check if the requested path exists as a file or directory.
    const filePath = path.join(...adapter.contentDir, urlPath);
    // Verify if the requested path is a file.
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) return res.sendFile(filePath);
        // Verify if the requested path is a directory.
        fs.stat(filePath, (err, stats) => {
            // If there is no "index.html", return 404 error.
            if (err || !stats.isDirectory()) return res.status(404).sendFile(path.join(...adapter.contentDir, `${urlPath}.html`));
            // If it is a directory, check if there is an "index.html" file inside.
            const indexPath = path.join(filePath, "index.html");
            fs.stat(indexPath, (err, stats) => {
                if (!err && stats.isFile()) return res.sendFile(indexPath);
                // If there is no "index.html", return 404 error.
                return res.status(404).sendFile(path.join(...adapter.contentDir, "404.html"));
            });
        });
    });
});

app.use((err, req, res, next) => {
    return res.status(404).sendFile(path.join(...adapter.contentDir, "404.html"));
});

app.listen(PORT, () => {
    getTech();
    generateRedirectsFile();
    console.log("\x1b[1m%s\x1b[0m", `[SERVER] Server started on port http://localhost:${PORT}/`);
});