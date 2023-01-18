/* eslint-disable */
const ALLOY_EDGE_CONFIG_ID = '2ebfe317-5fd9-407f-8f9d-d94f7013f62b';
const ALLOY_ORG_ID = '908936ED5D35CC220A495CD4@AdobeOrg';

alloy('configure', {
  debugEnabled: true,
  edgeConfigId: ALLOY_EDGE_CONFIG_ID,
  edgeDomain:
    location.host.indexOf("hlx.live") !== -1
      ? location.hostname
      : undefined,
  orgId: ALLOY_ORG_ID,
});

alloy('sendEvent', {
  data: {
    franklinWebSDKPartyTown: {
      init: true,
    },
  },
});
