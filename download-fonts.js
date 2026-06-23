const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir);
}

const fontUrls = [
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Space+Mono:wght@400;700&family=Caveat:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap'
];

// We need to request the CSS with a modern browser user agent to get woff2 files
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

let allCss = '';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
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

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
};

async function processFonts() {
    try {
        for (const url of fontUrls) {
            const css = await fetchUrl(url);
            allCss += css + '\n';
        }

        // Parse url(...) out of the css
        const urlRegex = /url\((https:\/\/[^)]+)\)/g;
        let match;
        let fontCounter = 0;
        
        while ((match = urlRegex.exec(allCss)) !== null) {
            const fontUrl = match[1];
            // Get family and weight from the preceding font-family and font-weight declarations?
            // Actually just hash or sequentially name them
            const ext = fontUrl.split('.').pop();
            const fileName = `font-${fontCounter}.${ext}`;
            const destPath = path.join(fontsDir, fileName);
            
            console.log(`Downloading ${fontUrl} to ${fileName}...`);
            await downloadFile(fontUrl, destPath);
            
            // Replace url in CSS
            allCss = allCss.replace(fontUrl, `fonts/${fileName}`);
            fontCounter++;
        }

        fs.writeFileSync(path.join(__dirname, 'fonts.css'), allCss);
        console.log('Fonts downloaded and fonts.css created successfully.');
    } catch (e) {
        console.error(e);
    }
}

processFonts();
