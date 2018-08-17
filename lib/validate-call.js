const parseUri = require('drachtio-srf').parseUri;

module.exports = (req, res, next) => {
  const logger = req.app.locals.logger;
  const numberMap = req.app.locals.numberMap;
  const callId = req.get('Call-ID');

  req.locals = {auth: {}};

  // only accepting calls from Voxbone
  if ('Vox Callcontrol' !== req.get('User-Agent')) {
    logger.info({callId}, 'rejecting call that did not come from Voxbone');
    return res.send(603);
  }

  // only accepting calls to our configured DIDs
  const uri = parseUri(req.uri);
  if (!numberMap.has(uri.user)) {
    logger.info({callId}, `rejecting call to non-configured DID ${uri.user}`);
    return res.send(404);
  }

  req.locals.calledNumber = numberMap.get(uri.user);
  logger.info({callId}, `redirecting call to ${uri.user} to ${req.locals.calledNumber}`);

  next();
};
