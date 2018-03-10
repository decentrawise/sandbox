
#pragma once
#include <eoslib/eos.hpp>   // Generic eos library, i.e. print, type, math, etc
#include <eoslib/token.hpp> // Token usage
#include <eoslib/db.hpp>    // Database access

namespace moeda {
    
    typedef eosio::token<uint64_t,N(moeda)> currency_tokens;

    struct transfer 
    {
        account_name       from;
        account_name       to;
        currency_tokens    quantity;
    };

    // row in account table stored within each scope
    struct account 
    {
        const uint64_t     key = N(account); // The key is constant because there is only one record per scope/currency/accounts
        currency_tokens    balance;

        account( currency_tokens b = currency_tokens() ):balance(b){}
        bool  is_empty()const  { return balance.quantity == 0; }
    };
    
    static_assert( sizeof(account) == sizeof(uint64_t) + sizeof(currency_tokens), "unexpected packing" );

    using accounts = eosio::table<N(moeda), N(moeda), N(account), account, uint64_t>;
    
}   // namespace moeda

