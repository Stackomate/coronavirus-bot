const repoUrl = process.env.WCOTA_REPO_URL;
const target = process.env.WCOTA_REPO_PATH;
const csvFile = 'cases-brazil-total.csv';


const pollUnofficial = () => {

    /* Synchronous */
    /*  Git clone if repo not present. THen pull */
    require('child_process').execSync(`git -C ${target} pull || git clone ${repoUrl} ${target}`);

    const date = require('child_process').execSync(`cd ${target} && git --no-pager log -1 --pretty="format:%ci" ${csvFile}`).toString();
    const rDate = new Date(date).toLocaleString("pt-BR")

    /* Read latest file */
    const results = []
    let totalUnofficial = null;
    let deaths = null;
    let stateInfo = [];
    
    const r = new Promise((resolve, reject) => {
        require('fs').createReadStream(
            require('path').relative(__dirname, `./${target}/${csvFile}`)
            ).pipe(
            require('csv-parser')()
        ).on('data', (data) => {
            results.push(data)
        }).on('end', () => {
            totalUnofficial = results[0].totalCases;
            deaths = results[0].deaths;
            stateInfo = results.map(r => {
                return {
                    ...r,
                    totalCases: parseInt(r.totalCases),
                    deaths: parseInt(r.deaths)
                }
            }).sort((a, b) => (a.totalCases > b.totalCases) ? -1 : 1);
            resolve({newValue: totalUnofficial, deaths, onlyCases: totalUnofficial - deaths, date: rDate, stateInfo});
        })    
    })

    return r;

}

module.exports = pollUnofficial;
