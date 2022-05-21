const method = parseEnvList(process.env.METHOD)
,     secret = parseEnvList(process.env.SECRET);

const request   = require('request')
,     express   = require('express')
,     app       = express()
,     http      = require('http').createServer(app)
,     crypto    = require('crypto')
,     MjpegDecoder = require('mjpeg-decoder');				//npm install mjpeg-decoder

function decrypt(encrypted, hmac) {
    //const method = 'AES-256-CBC'
    //,     secret = "My32charPasswordAndInitVectorStr"; //must be 32 char length

    if (crypto.createHmac('md5', secret).update(encrypted).digest('hex') == hmac.value) {
        const iv        = new Buffer.from(encrypted.substr(0, 24), 'base64').toString()
        ,     decryptor = crypto.createDecipheriv(method, secret, iv);
		
        return decryptor.update(encrypted.substr(24), 'base64', 'utf8') + decryptor.final('utf8');
    }
}
		
function server() {
	app.get('/', async (req, res) => {
        const hmac      = {value: req.query.hmac.replaceAll('%2B', '+')}
		,     encrypted = req.query.src.replaceAll('%2B', '+')
		,     decrypted = decrypt(encrypted, hmac)
        ,     src       = decrypted + req.query.r;
 
        //console.log("hmac value: " + hmac.value);
        //console.log("Encrypted: " + encrypted);
		//console.log("Decrypted: " + decrypted);
		
        if (req.query.action === 'snapshot') {
			//console.log("snapshot of: " + decrypted);
			
 			const decoder = MjpegDecoder.decoderForSnapshot(decrypted)
            ,     frame   = await decoder.takeSnapshot();
			
            res.send(frame);
	    }
	    else {
			//console.log('src: ' + src);
			
	        request(
			    {rejectUnauthorized: false, url: src, encoding: null}, (err, resp, buffer) => {
                    if (!err && resp.statusCode === 200) {
                        res.set("Content-Type", "image/jpeg");
                        res.send(resp.body);
                    }
				    else {
					    console.log('processing error for src: ' + src);
					    console.log('err: ' + err);
    				}
                });
		}
    });
	
	http.listen('3000', () => {
        console.log('Server started');
	});
}

server();