require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Security: List of allowed domains
const allowedDomains = process.env.ALLOWED_DOMAINS.split(',').map(domain => domain.trim());

// Security: Domain validation function
function isAllowedDomain(domain) {
    return allowedDomains.some(allowedDomain =>
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );
}

// Screenshot endpoint
app.post('/screenshot', async (req, res) => {
    console.log('CREATE_SCREENSHOT_REQUEST_STARTED')
    console.log('Process ID:', process.pid)
    console.log('Container Processes:');

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser = null;
    let context = null;
    let page = null;

    try {
        console.log('Connecting to Playwright server...');
        // Connect to remote Playwright instance with additional options
        browser = await chromium.connect(process.env.PLAYWRIGHT_WS_ENDPOINT, {
            timeout: 30000,
            headers: {
                'User-Agent': 'SecureScreenshotBot/1.0'
            }
        });

        // browser = await chromium.launch({
        //     args: [
        //         "--allow-insecure-localhost",
        //         "--disable-dev-shm-usage",
        //         "--disable-gpu",
        //         "--disable-software-rasterizer",
        //         "--disable-dev-shm-usage"
        //     ],
        //     timeout: 40000,
        //     headless: true,
        //     devtools: false,
        //     executablePath: process.env.CHROME_PATH || undefined,
        //     env: {
        //         ...process.env,
        //         CHROME_PATH: process.env.CHROME_PATH || undefined
        //     }
        // });
        console.log('Connected to Playwright server successfully');
        console.log('Browser process connected');

        console.log('Creating new browser context...');
        // Create a new context with security settings
        context = await browser.newContext({
            storageState: undefined,
            permissions: [],
            ignoreHTTPSErrors: false,
            javaScriptEnabled: true,
            userAgent: 'SecureScreenshotBot/1.0',
            viewport: { width: 1920, height: 1080 }
        });
        console.log('Browser context created successfully');
        console.log('Context process created');

        console.log('Creating new page...');
        // // Create a new page
        page = await context.newPage();
        await page.setDefaultNavigationTimeout(30000);
        console.log('New page created successfully');
        console.log('Page process created');

        // Security: Route handler to block unauthorized domains
        await page.route('**/*', route => {
            try {
                const domain = new URL(route.request().url()).hostname;
                if (!isAllowedDomain(domain)) {
                    console.log(`Blocked request to unauthorized domain: ${domain}`);
                    route.abort();
                } else {
                    route.continue();
                }
            } catch (error) {
                console.error('Error in route handler:', error);
                route.abort();
            }
        });

        // Navigate to the URL with additional options
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Take screenshot with additional options
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });

        // Send response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(screenshot);
        console.log('CREATE_SCREENSHOT_REQUEST_FINISHED')
    } catch (error) {
        console.log('CREATE_SCREENSHOT_REQUEST_FAILED')
        console.error('Screenshot error:', error);
        res.status(500).json({
            error: 'Failed to take screenshot',
            details: error.message
        });
    } finally {
        // Cleanup
        try {
            console.log('CREATE_SCREENSHOT_REQUEST_CLEANUP_STARTED')
            setTimeout(async () => {
                if (page) await page.close();
                if (context) await context.close();
                if (browser) await browser.close();
            }, 5000)
            console.log('CREATE_SCREENSHOT_REQUEST_CLEANUP_FINISHED')
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Playwright WebSocket endpoint: ${process.env.PLAYWRIGHT_WS_ENDPOINT}`);
}); 