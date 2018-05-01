#pragma once
#include <eosiolib/eosio.hpp>
#include <eosiolib/transaction.hpp>

namespace emanate {


    struct colab_permission_level : eosio::permission_level
    {
        colab_permission_level(account_name actor) : eosio::permission_level(actor, N(active)) {  }
    };
    
    class colab : public eosio::contract 
    {
        public:
            
            colab( account_name self ):contract(self){}

            void propose();
            void approve( account_name proposer, eosio::name proposal_name, eosio::permission_level level );
            void unapprove( account_name proposer, eosio::name proposal_name, eosio::permission_level level );
            void cancel( account_name proposer, eosio::name proposal_name, account_name canceler );
            void exec( account_name proposer, eosio::name proposal_name, account_name executer );

        private:
            struct proposal 
            {
                eosio::name                       proposal_name;       //  Project name
                eosio::vector<eosio::permission_level>   requested_approvals;
                eosio::vector<eosio::permission_level>   provided_approvals;
                eosio::vector<char>               packed_transaction;
                
                //  vector<std::string> original_files;     // Original files 
                //  std::string final_file;                 // Final file
                //  map<account_name, float> royalties;

                auto primary_key()const { return proposal_name.value; }
            };

            typedef eosio::multi_index<N(proposal),proposal> proposals;
    };

} /// namespace eosio
