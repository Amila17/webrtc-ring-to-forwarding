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
    var context = reqRecv.get('X-Voxbone-Context').split(';');

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
                to: context[0],
                userId: context[1],
                tenantCode: context[2],
                contactId: context[3],
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