const fs = require('fs');
const path = require('path');
const clearRequire = require('clear-require');
const custMap = new Map();
const numberMap = new Map();

module.exports = function(logger) {
  function initMap() {
    const customers = require('config').get('customers');
    let idx = 0;

    custMap.clear();
    numberMap.clear();

    Object.keys(customers).forEach((c) => {
      custMap.set(c, {auth: customers[c].auth});
      const pairs = customers[c]['number-mapping'];
      for (const arr in pairs) {
        numberMap.set(arr[0], {
          customer: c,
          ringTo: arr[1]
        });
      }
      idx += pairs.length;
    });
    logger.info(`configured ${idx} VoxDIDs for ${custMap.length} routing`);
  }

  fs.watch(path.resolve(__dirname, '..', 'config'), (event, filename) => {
    if (event === 'change' && filename.endsWith('.json')) {
      logger.info(`${filename} was changed, re-reading config`);
      clearRequire('config');
      initMap();
    }
  });

  initMap();

  return function getRoutingForDid(did) {
    if (numberMap.has(did)) {
      const info = numberMap.get(did);
      if (custMap.has(info.customer)) {
        const customer = custMap.get(info.customer);
        return {
          auth: customer.auth,
          ringTo: info.ringTo
        };
      }
    }
  };

};
