const { Builder, By, until } = require('selenium-webdriver');

const updateGraphs = async () => {
    let driver = await new Builder().forBrowser('chrome').build();
    await driver.get('https://labs.wesleycota.com/sarscov2/br/');
    await driver.manage().window().setRect({width: 605, height: 900})
    await driver.wait(until.elementLocated(By.id('map')), 45000);

    await driver.sleep(12000);
    /* Using False because hamburger menu icon would overlap map otherwise */
    await driver.executeScript("document.querySelector('#map').scrollIntoView(false)");
    await driver.sleep(2000);
    let result = await driver.findElement(By.id('map')).takeScreenshot();
    require('fs').writeFileSync('map.png', result, 'base64')

    await driver.executeScript("document.querySelector('#plotlydiv').scrollIntoView(false)");
    await driver.sleep(2000);
    let result2 = await driver.findElement(By.id('plotlydiv')).takeScreenshot();
    require('fs').writeFileSync('graph.png', result2, 'base64')

    await driver.quit();

    
}

updateGraphs()