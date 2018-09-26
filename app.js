const Srf = require('drachtio-srf');
const srf = new Srf();
const logger = srf.locals.logger = require('pino')();
const config = require('config');
const getRoutingForDid = require('./lib/number-mapping')(logger);
const validateCall = require('./lib/validate-call')(logger, getRoutingForDid);
const parseUri = Srf.parseUri;

// connect to the drachtio sip server
srf.connect(config.get('drachtio'))
  .on('connect', (err, hp) => logger.info(`listening for sip traffic on ${hp}`))
  .on('error', (err) => logger.info(err, 'error connecting'));

// middleware to filter out calls that don't come from Voxbone
srf.use('invite', validateCall);

// handle validated incoming calls
srf.invite((req, res) => {
  const uri = parseUri(req.uri);
  const callId = req.get('Call-ID');
  const headers = {from: `sip:${uri.user}@localhost`};
  if (req.locals.auth.diversion) {
    Object.assign(headers, {
      Diversion: `<sip:${req.locals.auth.diversion}@voxbone.com>;reason=unknown,counter=1,privacy=off` 
    });
  }

  const dest = `sip:${req.locals.ringTo}@${config.get('voxout.dns')}`;
  srf.createB2BUA(req, res, dest, {
    proxy: config.get('voxout.proxy'),
    auth: req.locals.auth,
    headers
  })
    .then(({uas, uac}) => {
      uas.other = uac;
      uac.other = uas;

      logger.info({callId}, `call connected successfully to ${req.locals.ringTo}`);

      return setHandlers({uas, uac});
    })
    .catch((err) => {
      logger.info({callId}, `failed to connect call: ${err}`);
    });
});

function setHandlers({uas, uac}) {
  [uas, uac].forEach((dlg) => {

    // when one side hangs up, hang up the other
    dlg.on('destroy', () => {
      logger.info({callId: dlg.sip.callId}, 'call ended');
      dlg.other.destroy();
    });

    // handle re-INVITEs
    dlg.on('modify', (req, res) => {
      logger.info({callId: dlg.sip.callId}, 're-INVITE with new SDP');
      return dlg.other.modify(req.body).then(() => res.send(200, {body: dlg.other.remote.spd}));
    });
  });

}
