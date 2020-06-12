export class General {
    count: string;
    unofficialCount: string
    unofficialDeaths: string;
    deaths: string;
    MSUpdate: Date;
    MSRecovered: number;
    unofficialUpdate: Date;
    sheetsCount: number;
    sheetsUpdate: Date;
    sheetsStateInfo: number;
    sheetsStateSuspects: number;
    sheetsStateRecovered: number;
    sheetsTotalSuspects: number;
    sheetsTotalRecovered: number;
    sheetsTotalDeaths: number;
    sheetsTotalTests: number;
    mapImageFileId: number;
    graphImageFileId: number;
    graphsUpdateTime: number;
    WMCount: number;
    WMDeaths: number;
    WMRecovered: number;
    WMUpdate: Date;
    beds_supplies: {};

    constructor() {
        this.count = "-1";
        this.unofficialCount = "-1";
        this.unofficialDeaths = "-1";
        this.deaths = '0';
        this.MSUpdate = new Date();
        this.MSRecovered = -1;
        this.unofficialUpdate = new Date();
        this.sheetsCount = -1;
        this.sheetsUpdate = new Date();
        this.sheetsStateInfo = -1;
        this.sheetsStateSuspects = -1;
        this.sheetsStateRecovered = -1;
        this.sheetsTotalSuspects = -1;
        this.sheetsTotalRecovered = -1;
        this.sheetsTotalDeaths = -1;
        this.sheetsTotalTests =1;
        this.mapImageFileId = -1;
        this.graphImageFileId = -1;
        this.graphsUpdateTime = -1;
        this.WMCount = -1;
        this.WMDeaths = -1;
        this.WMRecovered = -1;
        this.WMUpdate = new Date();
        this.beds_supplies = [];
    }
}