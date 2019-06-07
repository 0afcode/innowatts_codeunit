const fs = require('fs');
const readline = require('readline');
const path = require('path');
const moment = require('moment');

function createTimeSeries(data) {
    return new Promise((resolve, reject) => {
        if(!data) {
            reject('No data provided.');
            return;
        }
        let transformedData = {};
        data.forEach(row => {
            if(!transformedData.hasOwnProperty(row.Type))
                transformedData[row.Type] = [];

            for (let i = 1; i <= 31; i++) {
                let val = row.hasOwnProperty(i.toString()) ? row[i.toString()] : null;
                if(val !== null) {
                    transformedData[row.Type].push(
                        [moment(moment.utc(row.Date+" "+i,"YYYY-MM-DD H")).valueOf(), val]
                    )
                }
            }
        });
        resolve(transformedData);
    })
}

module.exports = {
    getInitialTable: function() {
        return new Promise(function(resolve, reject) {
            let filepath = path.join(__dirname,'../data','Disagg.json');
            let meterIdKeys = [];
            let allData = [];

            let rl = readline.createInterface({
                input: fs.createReadStream(filepath,{encoding: 'utf8'}),
                terminal: false
            });

            rl.on('line', line => {
                let obj = {};
                try {
                    obj = JSON.parse(line);
                    if(meterIdKeys.indexOf(obj["Meter_ID"]) === -1)
                        meterIdKeys.push(obj["Meter_ID"]);
                    allData.push(obj);
                }
                catch(e) {
                    console.log('ERR parse :: ' + e);
                    reject(e);
                }
            });

            rl.on('close', () => {
                let filepath = path.join(__dirname,'../data','structured_data.json');
                fs.writeFile(filepath, JSON.stringify(allData), err => {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Data saved as true JSON");
                    }
                });
                resolve(meterIdKeys);
            });
        });
    },
    getDataForMeter: function(meterId) {
        return new Promise((resolve, reject) => {
            let filepath = path.join(__dirname,'../data','structured_data.json');
            let cb = function(err, data) {
                if(err) {
                    reject(err);
                } else {
                    let arr  = JSON.parse(data).filter(f => {
                        return f.hasOwnProperty('Meter_ID') && f.Meter_ID === meterId;
                    });
                    createTimeSeries(arr)
                        .then(resolve)
                        .catch(e => {
                            reject(e);
                        });
                }
            };
            try {
                fs.readFile(filepath,{encoding: 'utf8'}, cb);
            }
            catch(e) {
                reject('Unable to open '+e);
            }
        })
    }
};
