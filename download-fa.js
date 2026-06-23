const fs = require('fs');
const https = require('https');
const path = require('path');

const faDir = path.join(__dirname, 'fontawesome');
const cssDir = path.join(faDir, 'css');
const webfontsDir = path.join(faDir, 'webfonts');

[faDir, cssDir, webfontsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const baseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0';
const cssUrl = `${baseUrl}/css/all.min.css`;

const fonts = [
    'fa-brands-400.woff2',
    'fa-brands-400.ttf',
    'fa-regular-400.woff2',
    'fa-regular-400.ttf',
    'fa-solid-900.woff2',
    'fa-solid-900.ttf',
    'fa-v4compatibility.woff2',
    'fa-v4compatibility.ttf'
];

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

async function downloadFA() {
    console.log('Downloading FontAwesome CSS...');
    await downloadFile(cssUrl, path.join(cssDir, 'all.min.css'));
    
    console.log('Downloading webfonts...');
    for (const font of fonts) {
        const url = `${baseUrl}/webfonts/${font}`;
        const dest = path.join(webfontsDir, font);
        console.log(`Downloading ${font}...`);
        try {
            await downloadFile(url, dest);
        } catch (e) {
            console.warn(`Could not download ${font}: ${e.message}`);
        }
    }
    console.log('Done!');
}

downloadFA();
