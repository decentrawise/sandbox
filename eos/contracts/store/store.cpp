
#include <eoslib/eos.hpp>
#include <store.hpp>
#include <eoslib/string.hpp>
#include "../moeda/moeda.hpp"

struct product
{
    uint64_t key;
    uint64_t name;
    uint64_t price;
    account_name supplier;
};

struct purchase
{
    uint64_t from;
    uint64_t product_index;
    uint64_t quantity;
};

using products = eosio::table<N(store), N(store), N(product), product, uint64_t>;


extern "C"
{

    void init() 
    {
       eosio::print( "Store initialization!\n" );
       product query;
       query.key = 2;
       if ( !products::get( query ))
       {
           eosio::print( "Store initialization - create product tables...\n" );
           product a1 { 1, N(prod.a.a), 150, N(suppliera) };
           product a2 { 2, N(prod.a.b), 250, N(suppliera) };
           product a3 { 3, N(prod.a.c), 350, N(suppliera) };
           product a4 { 4, N(prod.b.a), 450, N(supplierb) };
           product a5 { 5, N(prod.b.b), 550, N(supplierb) };
            
           products::store( a1 );
           products::store( a2 );
           products::store( a3 );
           products::store( a4 );
           products::store( a5 );
       }
    }

    void apply( uint64_t code, uint64_t action )
    {
//        eosio::print( "Hello World: ", eosio::name(code), "->", eosio::name(action), "\n" );
        if (code != N(store))
        {
            eosio::print( "Not for 'store' contract...\n" );
            return;
        }
       
        if( action != N(purchase) )
        {
            eosio::print( "Not a purchase...\n" );
            return;
        }
       
        purchase p = eosio::current_message< purchase >();
        product query;
        query.key = p.product_index;
        products::get( query );
        eosio::print( "store.cpp:apply - Trying to purchase ", eosio::name(query.name), " at ", query.price, " from ", eosio::name(query.supplier), "\n"  );
       
        moeda::transfer new_transfer;
        new_transfer.from = p.from;
        new_transfer.to = query.supplier;
        new_transfer.quantity = moeda::currency_tokens(query.price * p.quantity);

        eosio::print( "store.cpp:apply - New transfer from ", eosio::name(new_transfer.from), " to ", eosio::name(new_transfer.to), " of quantity ", new_transfer.quantity, "\n" );
        auto out_msg = eosio::message(N(moeda), N(transfer), new_transfer);
        out_msg.send();
    }

}


