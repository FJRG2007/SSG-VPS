import fs from "fs";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
    const urlPath = req.url.split("?")[0];
    if (urlPath.startsWith("/_astro") || urlPath.startsWith("/pagefind")) return res.sendFile(path.join(__dirname, "..", "dist", urlPath));
    // Check if the request URL ends with "index.html".
    if (urlPath.endsWith("index.html")) return res.redirect(urlPath.slice(0, -10));
    // Check if the request URL ends with ".html".
    if (urlPath.endsWith(".html")) return res.redirect(urlPath.slice(0, -5));
    // Check if the requested path exists as a file or directory.
    const filePath = path.join(__dirname, "..", 'dist', urlPath);
    // Verify if the requested path is a file.
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) return res.sendFile(filePath);
        // Verify if the requested path is a directory.
        fs.stat(filePath, (err, stats) => {
            // If there is no "index.html", return 404 error.
            if (err || !stats.isDirectory()) return res.status(404).sendFile(path.join(__dirname, "..", 'dist', '404.html'));
            // If it is a directory, check if there is an "index.html" file inside.
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err, stats) => {
                if (!err && stats.isFile()) return res.sendFile(indexPath);
                // If there is no "index.html", return 404 error.
                return res.status(404).sendFile(path.join(__dirname, "..", 'dist', '404.html'));
                
            });
        });
    });
});

app.use((err, req, res, next) => {
    return res.status(404).sendFile(path.join(__dirname, "..", 'dist', '404.html'));
});

app.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}/`);
});