// created by Albien Fezga
// 06/01/2019
// scroll to the bottom and adjust the batchSize and delayMs for execution of the api queries if needed
(function() {
    const request = require('request');
    const fs = require('fs');

    const TOKEN = process.argv[2];
    const END_POINT = "https://maps.googleapis.com/maps/api/geocode/json?key="+(TOKEN || "AIzaSyDtVbli-DqEY984NnMwLOyl2zh0ZaQZBRQ");

    const inputData = "SW SCHOLLS FERRY RD,# 102, 97007\n" +
        "15112,SW CANYON WREN WAY, 97007\n" +
        "15114,SW CANYON WREN WAY,97007\n" +
        "15116,SW CANYON WREN WAY,97007\n" +
        "15118,SW CANYON WREN WAY,97007\n" +
        "15120,SW CANYON WREN WAY,97007\n" +
        "14932,SW SCHOLLS FERRY RD,# 301,97007\n" +
        "14754,SW SCHOLLS FERRY RD,# 1017,97007\n" +
        "14339,SW BARROWS RD,97007\n" +
        "45.4336087,14932,SW SCHOLLS FERRY RD,# 201,97007\n" +
        "11950,SW HORIZON BLVD,97007\n";

    let addrArray = inputData.trim().replace(/\W\D$/g,"").split('\n');

    function dummyFun(x) {
        return new Promise(resolve => {
            console.log(x);
            setTimeout(reject,200, 'yo');
        });
    }

    function queryGeo(val) {
        return new Promise((resolve, reject) => {
            let queryUrl = END_POINT+"&address="+val;
            request({url: queryUrl}, (err, resp, body) => {
               if(err || (resp.statusCode && resp.statusCode > 300)) {
                   reject(val);
               } else if(resp.statusCode && resp.statusCode === 200) {
                   let result = '';
                   try {
                       result = JSON.parse(body);
                       let obj = {};
                       let i = result.results.length - 1;
                       obj.Address = result.results[i].formatted_address;
                       obj.Latitude = result.results[i].geometry.location.lat;
                       obj.Longitude = result.results[i].geometry.location.lng;
                       console.log(JSON.stringify(obj));
                       resolve(obj);
                   }
                   catch(e) {
                       reject(e.toString());
                   }
               } else {
                   reject(val);
               }
            });
        });
    }

    /** I could simply have simultaneously executed ALL of the queries but then would spam the api endpoint.
    * with this function, introduce some flow control */
    function delayAndFetch (dataArray, delayMs, batchSize, execFn) {
        // ** all this to add some flow control so we do not spam the api
        return new Promise(function(resolve, reject) {
            //check if valid params here first
            // ****
            if(!dataArray  || !delayMs || !batchSize || !execFn) {
                reject('Missing params');
                return;
            }
            if(!Array.isArray(dataArray) || typeof(delayMs) !== "number" || typeof(batchSize) !== "number" || typeof(execFn) !== "function") {
                reject('Invalid param type');
                return;
            }

            let c = 0, total = dataArray.length, results = [], fails = [], prArray = [];

            let timeLoop = setInterval(() => {
                let iterateFor = 0;
                if((c + batchSize) > (total -1) ) {
                    iterateFor = total - c;
                } else {
                    iterateFor = batchSize;
                }

                for(let i = c; i < (iterateFor + c); i++ )
                {
                    prArray.push(execFn(dataArray[i]).catch(() => {
                        fails.push(i);
                    }));
                }

                theStopper()

            }, delayMs);

            function theStopper() {
                if(prArray.length ===  total ){
                    clearInterval(timeLoop);
                    Promise.all(prArray).then(res => {
                        results = res.filter(f => { return f !== null || f !== undefined});
                        fails = fails.forEach( f => {
                            return dataArray[f];
                        });
                        resolve({results,fails});
                    });
                } else
                    c += batchSize;
            }
        });
    }

    const processResults = function(res) {
        const fails = res.fails, addrObj = res.results;
        // in this case, fails are going to be forgotten :)

        fs.writeFileSync('./data/geoCodeOutput.json',JSON.stringify(addrObj,null,2),{encoding: 'utf8'});
    };

    // inputArray, delay in ms, # of concurrent req, execFn
    delayAndFetch(addrArray,1000,3, queryGeo)
        .then(processResults).catch( e =>
        console.log("ERR "+e));
})();
