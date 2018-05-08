#include <emanatecolab.hpp>
#include <eosiolib/action.hpp>

namespace emanate {


void colab::propose(account_name proposer, eosio::name proposal_name, uint32_t price, eosio::vector<colab_data> requested)
{
    require_auth( proposer );

    proposals proptable( _self, proposer );
    eosio_assert( proptable.find( proposal_name ) == proptable.end(), "proposal with the same name exists" );

    //check_auth( buffer+trx_pos, size-trx_pos, requested );

    proptable.emplace( proposer, [&]( auto& prop ) 
    {
        prop.proposal_name       = proposal_name;
        prop.requested_approvals = std::move(requested);
        prop.price = price;
    });
}

void colab::approve( account_name proposer, eosio::name proposal_name, account_name approver ) 
{
    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto iter = std::find( prop_it->requested_approvals.begin(), prop_it->requested_approvals.end(), approver );
    eosio_assert( iter != prop_it->requested_approvals.end(), "approval is not on the list of requested approvals" );

    require_auth( iter->name );

    proptable.modify( prop_it, proposer, [&]( auto& mprop ) 
    {
        mprop.provided_approvals.push_back( *iter );
        mprop.requested_approvals.erase( iter );
    });
}

void colab::unapprove( account_name proposer, eosio::name proposal_name, account_name unapprover ) 
{
    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );
    auto iter = std::find( prop_it->provided_approvals.begin(), prop_it->provided_approvals.end(), unapprover );
    eosio_assert( iter != prop_it->provided_approvals.end(), "no approval previously granted" );

    require_auth( iter->name );

    proptable.modify( prop_it, proposer, [&]( auto& mprop ) 
    {
        mprop.requested_approvals.push_back( *iter );
        mprop.provided_approvals.erase( iter );
    });
}

void colab::cancel( account_name proposer, eosio::name proposal_name, account_name canceler ) 
{
    require_auth( canceler );

    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    proptable.erase(prop_it);
}

void colab::exec( account_name proposer, eosio::name proposal_name, account_name executer ) 
{
    require_auth( executer );

    proposals proptable( _self, proposer );
    auto prop_it = proptable.find( proposal_name );
    eosio_assert( prop_it != proptable.end(), "proposal not found" );

    auto trx = eosio::transaction();
    
    uint32_t percentage = 100;
    uint64_t totalPayment = 10000;
    for( const colab_data &data : prop_it->provided_approvals ) 
    {
        percentage -= data.percentage;
        eosio::action action( eosio::permission_level( executer, N(active) ), N(eosio.token), N(transfer), transfer{ executer, data.name, eosio::asset(totalPayment * data.percentage / 100, S(4, EMA)), "" } );
        trx.actions.emplace_back(std::move(action));
    }
    
    eosio::action action( eosio::permission_level( executer, N(active) ), N(eosio.token), N(transfer), transfer{ executer, proposer, eosio::asset(totalPayment * percentage / 100, S(4, EMA)), "" } );
    trx.actions.emplace_back(std::move(action));

    trx.send(0, executer);
}

} /// namespace eosio

EOSIO_ABI( emanate::colab, (propose)(approve)(unapprove)(cancel)(exec) )
