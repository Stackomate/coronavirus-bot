const { Builder, By, until, Capabilities } = require('selenium-webdriver');
const {Options} = require('selenium-webdriver/chrome');

const inLocoPath = require('path').resolve(__dirname, 'inloco');

const chromeOptions = new Options();
chromeOptions.setUserPreferences({
    "download.default_directory": inLocoPath,
    "download.prompt_for_download": false,
    "download.automatic_downloads": true,
    "profile.content_settings.exceptions.automatic_downloads.*.setting": 1
});

const capabilities = new Capabilities();

/** Update Beds and Supplies */
const updateDistancingGraphs = async function () {
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    try {
        await driver.manage().window().setRect({width: 1440, height: 900})
        await driver.get('https://mapabrasileirodacovid.inloco.com.br/pt/')



        const getPic = async (frameSelector) => {
            await driver.wait(until.elementLocated(By.className('tab-icon-download')), 45000);
            let downloadIconElement = await driver.findElement(By.className('tab-icon-download'));
            /* TODO: Hack, improve */
            await new Promise((r) => setTimeout(r, 5000));
            await (await driver.findElement(By.className('tab-icon-download'))).click();

            await driver.wait(until.elementLocated(By.css('[data-tb-test-id="DownloadImage-Button"]')), 45000);
            let downloadButtonElement = await driver.findElement(By.css('[data-tb-test-id="DownloadImage-Button"]'));
            await downloadButtonElement.click();
        }

        /* Images are inside frame */
        await driver.switchTo().frame(driver.findElement(By.css('iframe')));
        await getPic('iframe');
        /* Driver is inside of iframe already */
        await driver.sleep(5000);
        let loadingEl = await driver.findElement(By.id('loadingGlassPane'));
        await driver.wait(until.elementIsNotVisible(loadingEl));
        await driver.sleep(5000);
        await (await driver.findElement(By.id('tableauTabbedNavigation_tab_1'))).click()      
        await new Promise((r) => setTimeout(r, 5000));

        /* TODO: Improve */

        await getPic('iframe');

        await driver.sleep(6000);
        await driver.quit();

        require('child_process').execSync('mv -f "Visão Geral.png" visao.png', {cwd: inLocoPath})
        require('child_process').execSync('mv -f "Ranking dos estados.png" ranking.png', {cwd: inLocoPath})


    } catch (e) {
        const item = {
            action: 'fail update',
            value: e.toString(),
        };
        console.log('Failed to Update:', e)
        await driver.quit();
        return null;
    }
};

module.exports = updateDistancingGraphs;