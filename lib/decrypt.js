const crypto = require('crypto')
,     dotenv = require('dotenv').config({ path: '../' });

const method = process.env.METHOD
,     secret = process.env.SECRET;

module.exports = function (encrypted, hmac) { 
    if (crypto.createHmac('md5', secret).update(encrypted).digest('hex') == hmac.value) {
        const iv        = new Buffer.from(encrypted.substr(0, 24), 'base64').toString()
        ,     decryptor = crypto.createDecipheriv(method, secret, iv);
		
        return decryptor.update(encrypted.substr(24), 'base64', 'utf8') + decryptor.final('utf8');
    }
};