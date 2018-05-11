var fs = require("fs");
var Eos = require('eosjs') // Eos = require('./src')
let {ecc} = Eos.modules
var execSync = require('child_process').execSync;
var path = require('path');
var binaryen = require('binaryen')


function sleep(secs) {
  execSync("sleep " + secs);
}



class EOSClient {
    constructor() {
        this.path = '/media/Development/teamcity/work/bbe41581f85d305b/deps/bin/cleos';
        this.walletPath = '/home/miguel/wallet_info';
        this.eosContractsPath = '/media/Development/teamcity/work/a4908d7d50750010/build/contracts'
        this.userContractsPath = '/media/Development/sandbox/eos/contracts'
        
        if (fs.exists(this.path) == false) {
            throw "EOSClient application not found (" + this.path + ')';
        }
    }
    
    createCommand(command, params) {
        var commandArray = [this.path, command].concat(params);
        return commandArray.join(' ');
    }

    executeCommand(command)
    {
        var result = { status: 0 };
        try {
            result.output = execSync(command).toString();
        }
        catch( error ) {
            result = error;
        }
        return result;
    }
    
    setContract(contract, permission) {
        var command = this.createCommand('set contract', [permission, contract, '--permission', permission]);
        console.log(command);
        return this.executeCommand(command);
    }
    
    setSystemContract(contractName, permission) {
        return this.setContract(path.join(this.eosContractsPath, contractName), permission);
    }
    
    setUserContract(contractName, permission) {
        return this.setContract(path.join(this.userContractsPath, contractName), contractName);
    }
    
    createKeyPair() {
        var result = {}
        var cmd = this.createCommand('create key');
        var execResult = execSync(cmd).toString();
            
        var lines = execResult.split('\n');
        lines.forEach(line => {
            if (line.trim() == '')
                return;
            var parts = line.split(':');
            result[parts[0].split(' ')[0].toLowerCase()] = parts[1];
        });

        return result;
    }

    getKeyPair(accountName, level) {

        var result = {};
        
        if( level == 'wallet' ) {
            var privateKeyFile = path.join(this.walletPath, accountName, 'wallet', 'private');
            if( fs.existsSync(privateKeyFile) == false ) {
                throw "Wallet was not created yet";
            }
            result.private = fs.readFileSync(privateKeyFile).toString();
        }
        else {
            var privateKeyFile = path.join(this.walletPath, accountName, level, 'private');
            var publicKeyFile = path.join(this.walletPath, accountName, level, 'public');
            
            if( fs.existsSync(privateKeyFile) == false || fs.existsSync(publicKeyFile) == false ) {
                this.storeKeyPair(accountName, level, this.createKeyPair())
            }
            
            
            result.private = fs.readFileSync(privateKeyFile).toString();
            result.public = fs.readFileSync(publicKeyFile).toString();
        }
        return result;
    }
    
    storeKeyPair(accountName, level, keyPair) {
        var basePath = path.join(this.walletPath, accountName, level);
        execSync('mkdir -p ' + basePath);
        
        if( level == 'wallet' ) {
            fs.writeFileSync(path.join(basePath, 'private'), keyPair.private, 'utf8');
        }
        else {
            fs.writeFileSync(path.join(basePath, 'private'), keyPair.private, 'utf8');
            fs.writeFileSync(path.join(basePath, 'public'), keyPair.public, 'utf8');
        }
    }
    
    createWallet(walletName) {
        var command = this.createCommand('wallet create', ['--name', walletName]);
        var result = this.executeCommand(command);
        
        if( result.status == 0 ) {
            var pass = result.output.split('\n')[3].replace(/"/g, '');
            this.storeKeyPair(walletName, 'wallet', {private: pass});
        }
        return result;
    }
    
    
    unlockWallet(walletName)
    {
        var command = this.createCommand('wallet open', ['--name', walletName]);
        console.log(command);
        this.executeCommand(command);

        var pass = this.getKeyPair(walletName, 'wallet');
        var command = this.createCommand('wallet unlock', ['--name', walletName, '--password', pass.private]);
        console.log(command);
        return this.executeCommand(command);
    }

    insertKeysToWallet(walletName, keyPair) {
        var command = this.createCommand('wallet import' , ['--name', walletName, keyPair.private]);
        return this.executeCommand(command);
    }
    
    createAccount(accountName) {
        this.createWallet(accountName);
        this.unlockWallet(accountName);
        
        this.insertKeysToWallet(accountName, this.getKeyPair(accountName, 'owner'));
        this.insertKeysToWallet(accountName, this.getKeyPair(accountName, 'active'));

        var command = this.createCommand('create account', ['eosio', accountName, this.getKeyPair(accountName, 'owner').public, this.getKeyPair(accountName, 'active').public]);
        var result = this.executeCommand(command);
    }
    
    installContract(contractName) {
        this.createAccount(contractName);
        this.setUserContract(contractName);
    }
    
    pushAction(contractName, action, data, permissions) {
        var permissionsParsed = [];
        permissions.forEach(permission => {
            permissionsParsed = permissionsParsed.concat(['--permission', permission]);
        });
        var command = this.createCommand('push action', [contractName, action, "'" + JSON.stringify(data) + "'"].concat(permissionsParsed));
        return this.executeCommand(command);
    }
    
    getAccountBalance(accountName, token) {
        var command = this.createCommand('get currency balance', ['eosio.token', accountName, token]);
        var result = this.executeCommand(command);
        if( result.status == 0 ) {
            return result.output.toString();
        }
        return result;
    }
    
    createToken(amount) {
//         var data = {
//             "issuer": "eosio",
//             "maximum_supply": amount + ".0000 " + token,
//             "issuer_can_freeze": 0,
//             "issuer_can_recall": 0,
//             "issuer_can_whitelist": 0
//         };
//         this.pushAction('eosio.token', 'create', '["eosio", "1000000000.0000 "' + token + ', 0, 0, 0]', ['eosio.token']);
        var command = this.createCommand('push action', ['eosio.token', 'create', '\'["eosio", "' + amount + '", 0, 0, 0]\''].concat(['--permission eosio.token']));
        console.log(command);
        return this.executeCommand(command);
    }
    
    issueTokens(accountName, amount, token) {
        data = {
            "to": accountName,
            "quantity": [amount + '.0000', token].join(' '),
            "memo": "First issue"
        };
        this.pushAction('eosio.token', 'issue', data, ['eosio']);
    }
}

cleos = new EOSClient();

// Initialize system
cleos.createWallet('default');
cleos.unlockWallet('default');

cleos.setSystemContract('eosio.system', 'eosio');
cleos.setSystemContract('eosio.bios', 'eosio');

cleos.createAccount('eosio.token');
cleos.setSystemContract('eosio.token', 'eosio.token');

cleos.createToken('1000000000.0000 EOS');
cleos.createToken('1000000000.0000 EMA');

cleos.createAccount('colabuser1');
cleos.createAccount('colabuser2');
cleos.createAccount('user1');

cleos.issueTokens('user1', 100, 'EMA');
console.log(cleos.getAccountBalance('user1', 'EMA'));

cleos.installContract('emanatecolab');

var data = {
    "proposer": "colabuser1", 
    "proposal_name": "contract1", 
    "price": 10000, 
    "requested": [{ 
        "name": "colabuser2", 
        "percentage": "30" 
    }]
};

cleos.pushAction('emanatecolab', 'propose', data, ['colabuser1']);

data = {
    "proposer": "colabuser1", 
    "proposal_name": "contract1", 
    "approver": "colabuser2"
};

cleos.pushAction('emanatecolab', 'approve', data, ['colabuser1', 'colabuser2']);

data = {
    "proposer": "colabuser1", 
    "proposal_name": "contract1", 
    "executer": "user1"
};

cleos.pushAction('emanatecolab', 'exec', data, ['user1']);

sleep(2);

console.log(cleos.getAccountBalance('user1', 'EMA'));
console.log(cleos.getAccountBalance('colabuser1', 'EMA'));
console.log(cleos.getAccountBalance('colabuser2', 'EMA'));


