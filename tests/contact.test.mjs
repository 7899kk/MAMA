import test from 'node:test';
import assert from 'node:assert/strict';
import {processContact, validateContact, encodeMessage, isConfigured} from '../lib/contact.mjs';
const contact = {name:'Test Visitor',email:'visitor@example.com',message:'I would like to discuss an AI architecture project.',website:''};
const settings = {to:'recipient@example.com',from:'sender@example.com',accessToken:'test-only-token'};
test('blocks header injection, automated submissions, and invalid addresses before delivery', () => {
  assert.equal(validateContact({...contact,name:'Visitor\r\nBcc: attacker@example.com'}),null);
  assert.equal(validateContact({...contact,email:'visitor@example.com\r\nBcc: attacker@example.com'}),null);
  assert.equal(validateContact({...contact,website:'spam.example'}),null);
  assert.equal(validateContact({...contact,email:'bad-address'}),null);
  assert.equal(validateContact({...contact,message:'short'}),null);
});
test('unconfigured Gmail cannot report successful delivery',async () => {
  assert.equal(isConfigured({to:'recipient@example.com',from:'sender@example.com'}),false);
  const result=await processContact(contact,{settings:{},fetcher:()=>assert.fail('must not contact Gmail'),ip:'not-configured'});
  assert.equal(result.status,503);assert.equal(result.body.ok,undefined);
});
test('encodes Unicode messages and reply address correctly in MIME',() => {
  const mime=Buffer.from(encodeMessage({...contact,name:'José',message:'Hello — let’s discuss our RAG architecture.'},settings),'base64url').toString('utf8');
  assert.match(mime,/Reply-To: visitor@example.com\r\n/);
  const body=mime.split('\r\n\r\n')[1].replace(/\r\n/g,'');
  const decoded=Buffer.from(body,'base64').toString('utf8');
  assert.match(decoded,/José/);assert.match(decoded,/let’s discuss/);
  assert.match(mime,/Subject: =\?UTF-8\?B\?/);
});
test('reports success only when Gmail confirms a message ID; transport is mocked',async () => {
  let seen;
  const result=await processContact(contact,{settings,ip:'mock-success',fetcher:async(url,options)=>{
    seen={url,options};return {ok:true,json:async()=>({id:'mock-gmail-id'})};
  }});
  assert.equal(seen.url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  assert.equal(seen.options.headers.Authorization,'Bearer test-only-token');
  assert.equal(result.status,200);assert.equal(result.body.ok,true);
});
test('Gmail denial and missing acknowledgement cannot become success; transport is mocked',async () => {
  for(const response of [{ok:false},{ok:true,json:async()=>({})}]) {
    const result=await processContact(contact,{settings,ip:'mock-failure',fetcher:async()=>response});
    assert.equal(result.status,502);assert.equal(result.body.ok,undefined);
  }
});
test('refreshes an OAuth credential through Google before sending; transport is mocked',async()=>{
  const requests=[];
  const result=await processContact(contact,{settings:{to:settings.to,from:settings.from,clientId:'mock-client',clientSecret:'mock-secret',refreshToken:'mock-refresh'},ip:'mock-refresh',fetcher:async(url,options)=>{
    requests.push({url,options});
    return url.includes('oauth2')?{ok:true,json:async()=>({access_token:'mock-access',expires_in:3600})}:{ok:true,json:async()=>({id:'mock-id'})};
  }});
  assert.equal(result.status,200);assert.equal(requests.length,2);
  assert.equal(requests[0].url,'https://oauth2.googleapis.com/token');
  assert.equal(requests[1].options.headers.Authorization,'Bearer mock-access');
});
test('rate limits delivery attempts',async()=>{
  const fetcher=async()=>({ok:true,json:async()=>({id:'mock-id'})});
  for(let i=0;i<5;i++)assert.equal((await processContact(contact,{settings,fetcher,ip:'rate-limit-test'})).status,200);
  assert.equal((await processContact(contact,{settings,fetcher,ip:'rate-limit-test'})).status,429);
});
