'use strict';

const request   = require('request')						//npm install request
,     express   = require('express')						//npm install express
,     app       = express()
,     http      = require('http').createServer(app)
,     MjpegDecoder = require('mjpeg-decoder')				//npm install mjpeg-decoder
,     dotenv    = require('dotenv').config()				//npm i dotenv
,     decrypt   = require('./lib/decrypt.js');
//,     wtf = require("wtfnode");
const host = process.env.HOST || '0.0.0.0';  // Listen on a specific host via the HOST environment variable
const port = process.env.PORT || 8091;       // Listen on a specific port via the PORT environment variable
const method = process.env.METHOD
,     secret = process.env.SECRET;

function server() {
	//app.use(require('express-status-monitor')());
	
	app.get('/', async (req, res) => {
		let src;
		
		if (req.query.src.substr(0, 4) !== 'http') {
            const hmac      = {value: req.query.hmac.replaceAll('%2B', '+')}
		    ,     encrypted = req.query.src.replaceAll('%2B', '+');
			
		    src = decrypt(method, secret, encrypted, hmac);
		}
		else {
			src = req.query.src;
		}

        //console.log("hmac value: " + hmac.value);
        //console.log("Encrypted: " + encrypted);
		//console.log("Decrypted: " + decrypted);
		//console.log("dump");
        //console.log("-------------------");
        //wtf.dump();
        //console.log("-------------------\n");

		const options = {rejectUnauthorized: false, url: src, encoding: null, timeout: 20000};
		switch (req.query.action) {
            case 'snapshot':
			    console.log("snapshot of: " + src);
			
			    try {
		            const decoder = MjpegDecoder.decoderForSnapshot(src)
                    ,     frame   = await decoder.takeSnapshot();
					
					res.send(frame);
			    }
				catch(err) {
				    console('Snapshot error: ', err);	
					res.end();
				}
	    
		        break;
		    case 'stream':
			    console.log("stream: " + src);
			
			    res.on('close', () => {
                    console.log('Streaming to client closed');
					res.end();
                });

			    request(options)
				    .on('error', (err) => {
                        console.log('onerror: ', err.message);
						res.end();
                    })
					.pipe(res);
		        /*const req = request(options)
                    .on('response', function (res) {
                        if (res.statusCode === 200) {
                            req.pipe(res);
                        }
                    });*/
				
			    break;
	        default:
			    console.log('src: ' + src);
                //let startTime = Date.now();
				
                request(options, (err, resp, buffer) => {
                    if (!err && resp.statusCode === 200) {
                        res.set("Content-Type", "image/jpeg");
                        res.send(resp.body);
						
						//let time = Date.now();
						//console.log('loadTime: ' + (time - startTime));
                    }
			        else if (err) {
			            //console.log('processing error for src: ' + src);
			            console.log(src + ' :', err.message);
						res.end();
    		        }
				    else {
			            console.log(src + ' :', resp.statusCode);
					    res.end();
    		        }
                });
		}
		
		//res.on('finish', () => {            
          //  console.log('src finished: ' + src)
        //})

    });
	
	//http.on('error', (err) => {
		//console.log('http.on error: ', err);
	//});
	
	http.listen(port, host, () => {
        console.log('Server started at port: ', port);
	});
}

server();