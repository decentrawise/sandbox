var fs = require("fs");
var Eos = require('eosjs') // Eos = require('./src')
let {ecc} = Eos.modules
var proc = require('child_process');
var path = require('path');
var binaryen = require('binaryen')

var walletDir = path.join(process.env.HOME, 'wallet_info');

function getKey(account, level, type)
{   
    if( level == 'wallet' ) {
        path.join(walletDir, account, 'wallet_key');
        return fs.readFileSync(file);
    } else {
        var result = "";
        var file = path.join(walletDir, account, 'key_' + level);
        text = fs.readFileSync(file, 'utf8');
        text.split('\n').forEach(function(line){
            var lineArray = line.split(':');
            if( lineArray[0].toLowerCase().startsWith(type.toLowerCase()) ) {
                result = lineArray[1].trim();
            }
        });
        return result;
    }
    return "";
}


var eosPrivate = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
var eosPublic = "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"

var emanateColabPrivate = getKey('emanatecolab', 'active', 'private');
var colabUser1Private = getKey('colabuser1', 'active', 'private');
var colabUser2Private = getKey('colabuser2', 'active', 'private');
var user1Private = getKey('user1', 'active', 'private');


keyProvider = [eosPublic, eosPrivate, emanateColabPrivate, colabUser1Private, colabUser2Private, user1Private]
console.log(keyProvider);

eos = Eos.Localnet({keyProvider, binaryen});
// eos = Eos.Localnet()




emanateContract = null
eos.contract('emanatecolab').then(contract => 
{
    trans = null;
    opts = { sign: false, broadcast: false };
    
    eos.transaction(function(tr) {
	    console.log("inside transaction");
	    tr.signatures = keyProvider;
	    //tr.transfer('user1', 'colabuser1', '1 EOS', '') 
	    //eos.transfer('user1', 'colabuser2', '2 EOS', '')
    }).then(function(tr){ console.log("This is the then...") });


    //console.log(trans);
    //trans.signatures = [user1Private];
    //console.log(JSON.stringify(trans, null, 4));
    //contract.propose('colabuser1', 'contract1', {actor: 'colabuser2', permission:'active'}, null, {authorization: 'colabuser1'});
//    contract.propose('colabuser1', 'contract1', [{actor: 'colabuser2', permission:'active'}], {authorization: 'colabuser1'});
//    contract.approve('colabuser1', 'contract1', {actor: 'colabuser2', permission:'active'}, {authorization: 'colabuser2'});
//    contract.exec('colabuser1', 'contract1', 'user1', {authorization: 'user1'});
});



