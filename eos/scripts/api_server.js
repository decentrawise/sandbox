"use strict";

var fs = require("fs");
var path = require('path');
var Eos = require('eosjs')
const express = require('express')
const app = express()
var bodyParser = require('body-parser');

app.use(bodyParser.json());

function getKeyPair(accountName, level) {

    var result = {};
    var walletPath = path.join(process.env.HOME, 'wallet_info');
    
    if( level == null ) {
        level = 'active';
    }
    
    if( level == 'wallet' ) {
        var privateKeyFile = path.join(walletPath, accountName, 'wallet', 'private');
        if( fs.existsSync(privateKeyFile) == false ) {
            throw "Wallet was not created yet";
        }
        result.private = fs.readFileSync(privateKeyFile).toString();
    }
    else {
        var privateKeyFile = path.join(walletPath, accountName, level, 'private');
        var publicKeyFile = path.join(walletPath, accountName, level, 'public');
        
        result.private = fs.readFileSync(privateKeyFile).toString().trim();
        result.public = fs.readFileSync(publicKeyFile).toString().trim();
    }
    return result;
}

function eosCallOptions(scopes, permissions) {
    if( scopes == null ) {
        scopes = [];
    }
    
    if( permissions == null ) {
        permissions = [];
    }
    
    return {
        broadcast: true,
        sign: true,
        scope: scopes,
        authorization: permissions
    }
}

function resultOk(data) {
    if( data == null ) {
        data = {};
    }
    return { success: true, data: data };
}

function resultError(data) {
    if( data == null ) {
        data = {};
    }
    return { success: false, data: data };
}

function getEOSConfig() {
    return {
        httpEndpoint: 'http://localhost:8888',
        keyProvider: [
            getKeyPair('emanatecolab').private,
            getKeyPair('colabuser1').private,
            getKeyPair('colabuser2').private,
            getKeyPair('colabuser3').private,
            getKeyPair('colabuser4').private,
            getKeyPair('user1').private,
            getKeyPair('user2').private,
            getKeyPair('user3').private,
        ]
    }
}

function permissions(user, level) {
    if (level == null) {
        level = 'active';
    }
    return {account: user, permission: level};
}

const config = getEOSConfig();
var eos = Eos.Testnet(config);

app.get('/', (req, res) => res.send('Welcome to the Emanate API<p><a href="/api">Documentation<a/>'))

app.get('/api', function(req, res) {
    res.sendFile(path.join(process.cwd(), 'api.html'));
});


/*
 * {
 *     "from": <colaboration contract creator>
 *     "name": <colaboration contract name>
 *     "price": <execution price>
 *     "partners": [{
 *         "name": <partner name>
 *         "percentage": <royalty percentage>
 *     }]
 * }
 * 
 * http://localhost:85/propose/
 * {"from": "colabuser1", "name": "contract1", "price": 10000, "partners": [{"name": "colabuser2", "percentage": 10}]}
 * */
app.post('/propose', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emanatecolab"], [permissions("emanatecolab"), permissions(data.name)]);

    eos.contract('emanatecolab', options).then(contract => {
        contract.propose(data.from, data.name, data.price, data.filename, data.partners).then(function() { 
            res.send(resultOk()); 
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

/*
 * {
 *     "from": <accout accepting the contract>
 *     "proposer": <accout that proposed the contract>
 *     "contract": <contract name>
 * }
 * 
 * http://localhost:85/accept/
 * {"from": "colabuser2", "proposer": "colabuser1", "name": "contract1"}
 * */
app.post('/accept', bodyParser.json(), (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emanatecolab"], [permissions("emanatecolab")]);
    
    eos.contract('emanatecolab', options).then(contract => {
        contract.approve(data.proposer, data.name, data.from, { authorization: data.from }).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
    
})

/*
 * {
 *     "from": <accout rejecting the contract>
 *     "proposer": <accout that proposed the contract>
 *     "contract": <contract name>
 * }
 * 
 * http://localhost:85/reject/
 * {"from": "colabuser2", "proposer": "colabuser1", "name": "contract1"}
 * */
app.post('/reject', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emanatecolab"], [permissions("emanatecolab")]);

    eos.contract('emanatecolab', options).then(contract => {
        contract.unapprove(data.proposer, data.name, data.from, { authorization: data.from }).then(function() { 
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

/*
 * {
 *     "from": <accout canceling the contract>
 *     "proposer": <accout that proposed the contract>
 *     "contract": <contract name>
 * }
 * */
app.post('/cancel', (req, res) => {
    var data = req.body;
    
    res.send("Canceling the proposal");
})

/*
 * {
 *     "from": <accout executing the contract>
 *     "proposer": <accout that proposed the contract>
 *     "contract": <contract name>
 * }
 * */
app.post('/execute', (req, res) => {
    var data = req.body;
//     const options = eosCallOptions(["emanatecolab"], [{account: "emanatecolab", permission: "active"}]);
    const options = eosCallOptions(["emanatecolab"], [permissions("emanatecolab")]);
    
    eos.contract('emanatecolab', options).then(contract => {
        contract.exec(data.proposer, data.name, data.from, { authorization: data.from }).then(function() { 
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})


// app.post('/getBalance', (req, res) => {
//     var data = JSON.parse(req.query.data);
// })


/*
 * {
 *     "proposer": <accout that proposed the contract>
 *     "contract": <contract name>
 * }
 * */
app.post('/getContract', (req, res) => {
    var data = req.body;

    console.log(data);
    eos.getTableRows(true, 'emanatecolab', data.proposer, 'proposal').then(results => {
        //  TODO: Go through the results and find the proper contract from this user
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.listen(3000, () => console.log('Example app listening on port 3000!')) 
