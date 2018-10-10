const util = require('util');

const request = require('request');
const config = require('config');

module.exports = function(logger) {
  return function(reqRecv, reqSent) {

    //This is temporary
    logger.info("Receive:" + util.inspect(reqRecv));
    logger.info("======================================");
    logger.info("======================================");
    logger.info("Sent:" + util.inspect(reqSent));

    request.post(config.get('http-callback'), {
      json: true,
      body: {
        incomingDetails: {
          callId: reqRecv.get('Call-ID'),
          from: reqRecv.get('from'),
          cseq: reqRecv.get('cseq'),
          requestReceived: reqRecv
        },
        outgoingDetails: {
                callId: reqSent.get('Call-ID'),
                to: reqRecv.get('X-Voxbone-Context'),
                cseq: reqSent.get('cseq'),
                requestSent: reqSent
        }
      }
    }, (err, res, body) => {
      if (err) {
        return logger.error(err, 'Error invoking web callback');
      }
      logger.info('successfully post call-id mapping');
    });
  };
};