const repoUrl = 'https://github.com/wcota/covid19br';
const target = 'unofficial-data';


const pollUnofficial = () => {

    /* Synchronous */
    /*  Git clone if repo not present. THen pull */
    require('child_process').execSync(`git -C ${target} pull || git clone ${repoUrl} ${target}`);

    const date = require('child_process').execSync(`cd ${target} && git --no-pager log -1 --pretty="format:%ci" cases-brazil-total.csv`).toString();
    const rDate = new Date(date).toLocaleString("pt-BR")

    /* Read latest file */
    const results = []
    let totalUnofficial = null;
    
    const r = new Promise((resolve, reject) => {
        require('fs').createReadStream(
            require('path').relative(__dirname, `./${target}/cases-brazil-total.csv`)
            ).pipe(
            require('csv-parser')()
        ).on('data', (data) => {
            results.push(data)
        }).on('end', () => {
            totalUnofficial = results[0].totalCases;
            resolve({newValue: totalUnofficial, date: rDate});
        })    
    })

    return r;

}

module.exports = pollUnofficial;
