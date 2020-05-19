import low from 'lowdb';

export function setDefaultValues(db: low.LowdbSync<any>) {
    db.defaults({
        chats: [],
        count: -1,
        unofficialCount: -1,
        unofficialStateInfo: -1,
        unofficialDeaths: -1,
        deaths: '0',
        MSUpdate: new Date().toString(),
        MSRecovered: -1,
        unofficialUpdate: '',
        sheetsCount: -1,
        sheetsUpdate: new Date().toString(),
        sheetsStateInfo: -1,
        sheetsStateSuspects: -1,
        sheetsStateRecovered: -1,
        sheetsTotalSuspects: -1,
        sheetsTotalRecovered: -1,
        sheetsTotalDeaths: -1,
        sheetsTotalTests: -1,
        mapImageFileId: -1,
        graphImageFileId: -1,
        graphsUpdateTime: -1,
        WMCount: -1,
        WMDeaths: -1,
        WMRecovered: -1,
        WMUpdate: new Date().toString(),
        beds_supplies: {},
        socialDistancing: {
            graph: null,
            ranking: null
        },
        registry: {
            deaths: -1,
            update: new Date().toString()
        }
    }).write()   
}

export function mountDBObject(db: low.LowdbSync<any>) {
    /** Last Cases Count from MS */
    let lastMSCasesCount = db.get('count').value();
    /** Last Deaths Count from MS */
    let lastMSDeathsValue = db.get('deaths').value();
    /** Last time for MSUpdate */
    let lastMSUpdate = db.get('MSUpdate').value();
    let lastMSRecovered = db.get('MSRecovered').value();
    /** Last time for Wcota Update */
    let lastWCotaUpdateTime = db.get('unofficialUpdate').value();
    /** Last WCota state table data */
    let lastWCotaStateInfo = db.get('unofficialStateInfo').value();
    /** Last WCota Cases Count */
    let lastWCotaCasesCount = db.get('unofficialCount').value();
    /** Last WCota Deaths Count */
    let lastWCotaDeathsCount = db.get('unofficialDeaths').value();

    /** Last Cases Count from Sheets */
    let lastSheetsCasesCount = db.get('sheetsCount').value()
    /** Last time for Sheets update */
    let lastSheetsUpdate = db.get('sheetsUpdate').value()
    /** Last Sheets state table data */
    let lastSheetsStateInfo = db.get('sheetsStateInfo').value();

    let lastSheetsStateRecovered = db.get('sheetsStateRecovered').value();
    let lastSheetsTotalRecovered = db.get('sheetsTotalRecovered').value();

    let lastSheetsStateSuspects = db.get('sheetsStateSuspects').value();
    let lastSheetsTotalSuspects = db.get('sheetsTotalSuspects').value();

    let lastSheetsTotalDeaths = db.get('sheetsTotalDeaths').value();
    let lastSheetsTotalTests = db.get('sheetsTotalTests').value();

    /** Worldometer */
    let lastWMCount = db.get('WMCount').value();
    let lastWMDeaths = db.get('WMDeaths').value();
    let lastWMRecovered = db.get('WMRecovered').value();
    let lastWMUpdate = db.get('WMUpdate').value();

    /** For Beds and Supplies */
    let lastBedsObject = db.get('beds_supplies').value();

    /** For Registry data */
    let lastRegistryDeaths = db.get('registry.deaths').value();
    let lastRegistryUpdate = db.get('registry.update').value();
}
