const LambdaTester = require( 'lambda-tester' );
const chai = require('chai')
    , expect = chai.expect

const myHandler = require( './create' ).create;
 
describe( 'create', function() {
 
    it( 'test success', function() {
 
        return LambdaTester( myHandler )
            .event( { name: 'Artem' } )
            .expectResult();
    });
});