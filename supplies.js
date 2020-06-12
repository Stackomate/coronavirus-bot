const { Builder, By, until } = require('selenium-webdriver');

/** Update Beds and Supplies */
const updateSupplies = async function () {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://covid-insumos.saude.gov.br/paineis/insumos/painel.php')

        const getFrameValue = async (frameId) => {
            await driver.wait(until.elementLocated(By.id(frameId)), 45000);

            await driver.switchTo().frame(driver.findElement(By.id(frameId)));
    
            let labelElement = await driver.findElement(By.className('apexcharts-datalabel'));
            await driver.wait(until.elementTextMatches(labelElement, /.+/), 45000);
            let elText = await labelElement.getAttribute('innerHTML');
            await driver.switchTo().defaultContent();
            return parseInt(elText.replace(/,/g, ''), 10);
        }

        let distributedVaccines = await getFrameValue('distribuidas');
        let usedVaccines = await getFrameValue('aplicadas');
        let surgeryMasks = await getFrameValue('mascara_3_camadas');
        let n95Masks = await getFrameValue('mascara95');
        let alcohol = await getFrameValue('alcool');
        let apron = await getFrameValue('avental');
        let quickTestKits = await getFrameValue('kit');
        let gloves = await getFrameValue('luava_proc_n_cirurgico');
        let protectiveGlasses = await getFrameValue('oculos_protecao');
        let sneakersAndCaps = await getFrameValue('sapatilha_touca');


        let btn = await driver.findElement(By.css("[href='painel_leitos.php']"))
        await btn.click();

        let tempBeds = await getFrameValue('graflocados')
        let icuBeds = await getFrameValue('uti')
        
        await driver.quit();

        let result = {
            distributedVaccines,
            usedVaccines,
            surgeryMasks,
            n95Masks,
            alcohol,
            apron,
            quickTestKits,
            gloves,
            protectiveGlasses,
            sneakersAndCaps,
            tempBeds,
            icuBeds           
        }
        return result;

    } catch (e) {
        const item = {
            action: 'fail update',
            value: e.toString(),
        };
        await driver.quit();
        return null;
    }
};

module.exports = updateSupplies;