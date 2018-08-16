const fs = require('fs');
const clearRequire = require('clear-require');
const numberMap = new Map();

module.exports = function(logger) {
  function initMap() {
    numberMap.clear();
    const pairs = require('config').get('number-mapping');
    pairs.forEach((m) => numberMap.set(m[0], m[1]));
    logger.info(`configured ${pairs.length} VoxDIDs for routing`);
  }

  fs.watchFile('../config', (event, filename) => {
    if (event === 'change' && filename.endsWith('.json')) {
      logger.info(`${filename} was changed, re-reading config`);
      clearRequire('config');
      initMap();
    }
  });

  initMap();

  return numberMap;
};
