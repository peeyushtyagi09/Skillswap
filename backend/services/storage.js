const path = require('path');
const fs = require('fs');

// Simple Local Storage for dev with signed URL mock, replace with S3 when configured.
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function getLocalStorageDir() {
    const dir = path.join(__dirname, '..', 'uploads');
    ensureDir(dir);
    return dir;
}

async function saveBufferToLocal(fileName, buffer) {
    const dir = getLocalStorageDir();
    const filePath = path.join(dir, fileName);
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
}

function getSignedUrl(publicPath) {
    // In dev, just return absolute path reference. In prod, sign S3 URL.
    return publicPath;
}

module.exports = { saveBufferToLocal, getSignedUrl };
// Whole Picture — What this code does
// This is a simple local file storage system for development.

// When you give it a file name and data (buffer), it:

// Figures out where your uploads folder is.

// Makes sure that folder exists.

// Saves the file there.

// Returns a public path so you can later access that file.

// Later, in production, the idea is to replace this with cloud storage (like Amazon S3)
//  where getSignedUrl would actually create a secure, temporary download link.