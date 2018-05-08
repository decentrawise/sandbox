#pragma once
#include <eosiolib/eosio.hpp>
#include <eosiolib/transaction.hpp>
#include <eosiolib/asset.hpp>

namespace emanate {
    
    struct colab_data
    {
        account_name name;
        uint32_t percentage;
        // std::string file;

        bool operator == (account_name n) const { return name == n; }

        EOSLIB_SERIALIZE( colab_data, (name)(percentage) )
    };

    struct transfer
    {
        account_name from;
        account_name to;
        eosio::asset quantity;
        std::string  memo;
        
        EOSLIB_SERIALIZE( transfer, (from)(to)(quantity)(memo) )
    };
    
    class colab : public eosio::contract 
    {
        public:
            
            colab( account_name self ):contract(self){}

            void propose(account_name proposer, eosio::name proposal_name, uint32_t price, eosio::vector<colab_data> requested);
            void approve( account_name proposer, eosio::name proposal_name, account_name approver );
            void unapprove( account_name proposer, eosio::name proposal_name, account_name unapprover );
            void cancel( account_name proposer, eosio::name proposal_name, account_name canceler );
            void exec( account_name proposer, eosio::name proposal_name, account_name executer );

        private:
            struct proposal 
            {
                eosio::name                     proposal_name;       //  Project name
                eosio::vector<colab_data>       requested_approvals;
                eosio::vector<colab_data>       provided_approvals;
                uint32_t                        price;
                
                //  vector<std::string> original_files;     // Original files 
                //  std::string final_file;                 // Final file

                auto primary_key()const { return proposal_name.value; }
            };

            typedef eosio::multi_index<N(proposal),proposal> proposals;
    };

} /// namespace eosio
