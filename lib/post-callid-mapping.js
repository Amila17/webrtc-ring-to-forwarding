const request = require('request');
const config = require('config');

module.exports = function(logger) {
  return function(reqRecv, reqSent) {
    request.post(config.get('http-callback'), {
      json: true,
      body: {
        incomingCallId: reqRecv.get('Call-ID'),
        outgoingCallId: reqSent.get('Call-ID')
      }
    }, (err, res, body) => {
      if (err) {
        return logger.error(err, 'Error invoking web callback');
      }
      logger.info('successfully post call-id mapping');
    });
  };
};

