const LambdaTester = require('lambda-tester');

const fhHandler = require('./fhController').putToStream;
const exportFiles = require('./exportFiles').DE;

describe('putToStream', function () {
  it('should put to stream', function () {
    return LambdaTester(fhHandler)
      .event({ name: 'Unknown' })
      .expectResolve();
  });
});

describe('export files', function () {
  it('should export files', function () {
    return LambdaTester(exportFiles)
    .event({ name: 'Unknown' })
    .expectResolve();
  });
});
