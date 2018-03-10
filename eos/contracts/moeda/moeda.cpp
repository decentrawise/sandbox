#include <moeda.hpp>
    
moeda::account get_account( account_name owner )
{
    moeda::account owned_account;
    
    moeda::accounts::get( owned_account, owner ); //  scope, record
    return owned_account;
}

//  When storing accounts, check for empty balance and remove account
void store_account( account_name account_to_store, const moeda::account& a )
{
    if( a.is_empty() ) 
    {
        eosio::print("Removing account ", eosio::name(account_to_store), "\n");
        moeda::accounts::remove( a, account_to_store ); // value, scope
    } 
    else 
    {
        eosio::print("Storing account ", eosio::name(account_to_store), "\n");
        moeda::accounts::store( a, account_to_store ); // value, scope
    }
}

void apply_currency_transfer( const moeda::transfer& transfer )
{
    eosio::print("Making a transfer...\n");
    eosio::require_notice( transfer.to, transfer.from );
    //require_auth( transfer.from );

    auto from = get_account( transfer.from );
    auto to   = get_account( transfer.to );

    from.balance -= transfer.quantity; /// token subtraction has underflow assertion
    to.balance   += transfer.quantity; /// token addition has overflow assertion

    store_account( transfer.from, from );
    store_account( transfer.to, to );
}

extern "C" 
{

    void init()
    {
       moeda::account owned_account;

       if ( !moeda::accounts::get( owned_account, N(moeda) )) 
       {
          eosio::print("Initializing moeda\n");
          store_account( N(moeda), moeda::account( moeda::currency_tokens(1000ull*1000ull*1000ull) ) );
       }
    }

    /// The apply method implements the dispatch of events to this contract
    void apply( uint64_t code, uint64_t action ) {
       if( code == N(moeda) ) 
       {
          if( action == N(transfer) )
          {
              moeda::transfer t = eosio::current_message< moeda::transfer >();
              eosio::print("moeda.cpp:apply making a transfer from ", eosio::name(t.from), " to ", eosio::name(t.to), " of quantity ", t.quantity, "\n");
              apply_currency_transfer( eosio::current_message< moeda::transfer >() );
          }
          else if( action == N(test) )
              eosio::print( "Hello World: ", eosio::name(code), "->", eosio::name(action), "\n" );
       }
    }    

} // extern "C"
