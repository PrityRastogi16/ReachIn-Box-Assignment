const axios = require("axios");

var options = {
  method: 'POST',
  url: 'https://oauth2.googleapis.com/token',
  headers: {'content-type': 'application/x-www-form-urlencoded'},
  data: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: '909084698673-anm90fg5059u8ib30ga9i0e36bil3n6r.apps.googleusercontent.com',
    client_secret: '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',
    code: '4/0AeaYSHAMEH5WfhU1gqIV5MPKy2G2mQgpApKwicZsm_5rsch_Ap7lnvNYLqbtrDR1ra47VQ',
    redirect_uri: 'http://localhost:2002/auth/google/callback'
  })
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).then(data=>console.log(data))
.catch(function (error) {
  console.error(error);
});