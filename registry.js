const axios = require('axios');

const getRegistry = async () => {
    // Make a request for a user with a given ID
    const today = new Date().toISOString().split('T')[0];
    let result = await axios.get(`https://transparencia.registrocivil.org.br/api/covid?chartId=chart2&data_type=data_registro&start_date=2020-01-01&end_date=${today}&state=all&city_id=all&search=death-covid`);
    let total = null;
    let json = null;
    let lastUpdate = null
    try {
        json = result.data;
        total = Object.keys(json.chart).map(k => json.chart[k]).reduce((acc, v) => acc + v, 0)
        lastUpdate = result.data.created_at;
        return {
            total, lastUpdate
        }        
    } catch (e) {
        return null;
    }
}

module.exports = getRegistry;