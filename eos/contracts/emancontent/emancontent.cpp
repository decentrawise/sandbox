/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */
#include <emancontent.hpp>

namespace emanate
{
    
void content::addtrack(account_name owner, const trackMetadata &metadata)
{
    require_auth( owner );
    prints("aaaaaa");
    
    trackTable tracks( _self, owner );

    tracks.emplace( owner, [&]( auto &track )
    {
        prints("bbbbb");
        track.id = tracks.available_primary_key();
        track.title = metadata.trackName;   //  extract from the json metadata
        track.metadata = metadata;
        prints("ccccc");
    });
}

EOSIO_ABI( emanate::content, (addtrack) )


}   // namespace emanate
