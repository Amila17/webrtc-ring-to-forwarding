const parseUri = require('drachtio-srf').parseUri;

module.exports = function(logger, getRoutingForDid) {
  return (req, res, next) => {
    const callId = req.get('Call-ID');

    // only accepting calls from Voxbone
    if ('Vox Callcontrol' !== req.get('User-Agent')) {
      logger.info({callId}, 'rejecting call that did not come from Voxbone');
      return res.send(603);
    }

    // check if routable DID
    const uri = parseUri(req.uri);
    const routing = getRoutingForDid(uri.user);

    if (!routing) {
      logger.info({callId}, `DID not found ${uri.user}`);
      return res.send(404);
    }

    logger.info({callId}, `routing call to VoxDID ${uri.user} to ${routing.ringTo}`);
    req.locals = {
      auth: routing.auth,
      ringTo: routing.ringTo
    };

    next();
  };
};

