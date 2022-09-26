'use strict';

import request from 'request';      				//npm install request
import got from 'got';                              //npm i got
import express from 'express';						//npm install express
import * as h from 'http';
import MjpegDecoder from 'mjpeg-decoder';			//npm install mjpeg-decoder
import dotenv from 'dotenv';						//npm i dotenv
import decrypt from './lib/decrypt.js';

dotenv.config();	
const app  = express();
const http = h.createServer(app);
const host = process.env.HOST || '0.0.0.0';  // Listen on a specific host via the HOST environment variable
const port = process.env.PORT || 8091;       // Listen on a specific port via the PORT environment variable
const method = process.env.METHOD
,     secret = process.env.SECRET;
let   totalTime = 0;

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

function server() {
	//app.use(require('express-status-monitor')());
	
	app.get('/', async (req, res) => {
		let src, resp;
		let time, startTime, loadTime;
		
		//await delay(10000);
		
		if (req.query.src.substr(0, 4) !== 'http') {
            const hmac      = {value: req.query.hmac.replaceAll('%2B', '+')}
		    ,     encrypted = req.query.src.replaceAll('%2B', '+');
			
		    src = await decrypt(method, secret, encrypted, hmac);
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
                startTime = Date.now();
				
				/*try {
				    resp = await got(src, { responseType: 'buffer' });
					
					res.set("Content-Type", "image/jpeg");
                    res.send(resp.body);
				}
				catch(error) {
                    console.log(error.message);
					res.end();
                } 
				
				time = Date.now();
				loadTime = time - startTime;
				totalTime += loadTime; 
				console.log('loadTime: ', loadTime, 'totalTime: ', totalTime);*/
				
                //const buffer = await resp.buffer();
                request(options, (err, resp, buffer) => {
                    if (!err && resp.statusCode === 200) {
                        res.set("Content-Type", "image/jpeg");
                        res.send(resp.body);
						
						let time = Date.now();
						loadTime = time - startTime;
				        totalTime += loadTime; 
				        console.log('loadTime: ', loadTime, 'totalTime: ', totalTime);
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