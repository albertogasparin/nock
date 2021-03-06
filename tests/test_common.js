'use strict';

var common  = require('../lib/common')
  , tap     = require('tap')
  , matchBody = require('../lib/match_body');

tap.test('matchBody ignores new line characters from strings', function(t) {
  var str1 = "something //here is something more \n";
  var str2 = "something //here is something more \n\r";
  var matched = matchBody(str1, str2);
  t.true(matched);
  t.end()
});

tap.test('matchBody keeps new line characters if specs is a function', function(t) {
  var body = "something //here is something more \n";
  var bodyAsSpecParameter = null
  var spec = function(bodyToTest) {
    bodyAsSpecParameter = bodyToTest
  }
  matchBody(spec, body);
  t.equal(bodyAsSpecParameter, body);
  t.end()
});

tap.test('matchBody should not throw, when headers come node-fetch style as array', function(t) {
  var testThis = {
    headers: {
      'Content-Type': ["multipart/form-data;"]
    }
  }
  matchBody.call(testThis, {}, "test");
  t.end()
});

tap.test('matchBody should not ignore new line characters from strings when Content-Type contains \'multipart\'', function(t) {
  var str1 = "something //here is something more \nHello";
  var str2 = "something //here is something more \nHello";
  var testThis = {
    headers: {
      'Content-Type': "multipart/form-data;"
    }
  }
  var matched = matchBody.call(testThis, str1, str2);
  t.true(matched);
  t.end()
});

tap.test('matchBody should not ignore new line characters from strings when Content-Type contains \'multipart\' (arrays come node-fetch style as array)', function(t) {
  var str1 = "something //here is something more \nHello";
  var str2 = "something //here is something more \nHello";
  var testThis = {
    headers: {
      'Content-Type': ["multipart/form-data;"]
    }
  }
  var matched = matchBody.call(testThis, str1, str2);
  t.true(matched);
  t.end()
});

tap.test('matchBody uses strict equality for deep comparisons', function(t) {
  var spec = { number: 1 };
  var body = '{"number": "1"}';
  var matched = matchBody(spec, body);
  t.false(matched);
  t.end()
});

tap.test('isBinaryBuffer works', function(t) {

  //  Returns false for non-buffers.
  t.false(common.isBinaryBuffer());
  t.false(common.isBinaryBuffer(''));

  //  Returns true for binary buffers.
  t.true(common.isBinaryBuffer(new Buffer('8001', 'hex')));

  //  Returns false for buffers containing strings.
  t.false(common.isBinaryBuffer(new Buffer('8001', 'utf8')));

  t.end();

});

tap.test('headersFieldNamesToLowerCase works', function(t) {

  var headers = {
    'HoSt': 'example.com',
    'Content-typE': 'plain/text'
  };

  var lowerCaseHeaders = common.headersFieldNamesToLowerCase(headers);

  t.equal(headers.HoSt, lowerCaseHeaders.host);
  t.equal(headers['Content-typE'], lowerCaseHeaders['content-type']);
  t.end();

});

tap.test('headersFieldNamesToLowerCase throws on conflicting keys', function(t) {

  var headers = {
    'HoSt': 'example.com',
    'HOST': 'example.com'
  };

  try {
    common.headersFieldNamesToLowerCase(headers);
  } catch(e) {
    t.equal(e.toString(), 'Error: Failed to convert header keys to lower case due to field name conflict: host');
    t.end();
  }

});

tap.test('headersFieldsArrayToLowerCase works on arrays', function (t) {
  var headers = ['HoSt', 'Content-typE'];

  var lowerCaseHeaders = common.headersFieldsArrayToLowerCase(headers);

  // Order doesn't matter.
  lowerCaseHeaders.sort();

  t.deepEqual(lowerCaseHeaders, ['content-type', 'host']);
  t.end();
});

tap.test('headersFieldsArrayToLowerCase deduplicates arrays', function (t) {
  var headers = ['hosT', 'HoSt', 'Content-typE', 'conTenT-tYpe'];

  var lowerCaseHeaders = common.headersFieldsArrayToLowerCase(headers);

  // Order doesn't matter.
  lowerCaseHeaders.sort();

  t.deepEqual(lowerCaseHeaders, ['content-type', 'host']);
  t.end();
});

tap.test('deleteHeadersField deletes fields with case-insensitive field names', function(t) {

  var headers = {
    HoSt: 'example.com',
    'Content-typE': 'plain/text'
  };

  t.true(headers.HoSt);
  t.true(headers['Content-typE']);

  common.deleteHeadersField(headers, 'HOST');
  common.deleteHeadersField(headers, 'CONTENT-TYPE');

  t.false(headers.HoSt);
  t.false(headers['Content-typE']);
  t.end();

});

tap.test('matchStringOrRegexp', function (t) {
  t.true(common.matchStringOrRegexp('to match', 'to match'), 'true if pattern is string and target matches');
  t.false(common.matchStringOrRegexp('to match', 'not to match'), 'false if pattern is string and target doesn\'t match');

  t.true(common.matchStringOrRegexp(123, 123), 'true if pattern is number and target matches');

  t.false(common.matchStringOrRegexp(undefined, 'to not match'), 'handle undefined target when pattern is string');
  t.false(common.matchStringOrRegexp(undefined, /not/), 'handle undefined target when pattern is regex');

  t.ok(common.matchStringOrRegexp('to match', /match/), 'match if pattern is regex and target matches');
  t.false(common.matchStringOrRegexp('to match', /not/), 'false if pattern is regex and target doesn\'t match');
  t.end();
});

tap.test('stringifyRequest', function (t) {
  var getMockOptions = function () {
    return {
      method: "POST",
      port: 81,
      proto: 'http',
      hostname: 'www.example.com',
      path: '/path/1',
      headers: {
        cookie: 'fiz=baz'
      }
    };
  }
  var body = {"foo": "bar"};
  var postReqOptions = getMockOptions();

  t.equal(common.stringifyRequest(postReqOptions, body),
    JSON.stringify({
      "method":"POST",
      "url":"http://www.example.com:81/path/1",
      "headers":{
        "cookie": "fiz=baz"
      },
      "body": {
        "foo": "bar"
      }
    }, null, 2)
  );

  var getReqOptions = getMockOptions();
  getReqOptions.method = "GET";

  t.equal(common.stringifyRequest(getReqOptions, null),
    JSON.stringify({
      "method":"GET",
      "url":"http://www.example.com:81/path/1",
      "headers":{
        "cookie": "fiz=baz"
      }
    }, null, 2)
  );

  t.end();
});


tap.test('headersArrayToObject', function (t) {
  var headers = [
    "Content-Type",
    "application/json; charset=utf-8",
    "Last-Modified",
    "foobar",
    "Expires",
    "fizbuzz"
  ];

  t.deepEqual(common.headersArrayToObject(headers), {
    "Content-Type": "application/json; charset=utf-8",
    "Last-Modified": "foobar",
    "Expires": "fizbuzz"
  });

  var headersMultipleSetCookies = headers.concat([
    "Set-Cookie",
    "foo=bar; Domain=.github.com; Path=/",
    "Set-Cookie",
    "fiz=baz; Domain=.github.com; Path=/"
  ]);

  t.deepEqual(common.headersArrayToObject(headersMultipleSetCookies), {
    "Content-Type": "application/json; charset=utf-8",
    "Last-Modified": "foobar",
    "Expires": "fizbuzz",
    "Set-Cookie": [
      "foo=bar; Domain=.github.com; Path=/",
      "fiz=baz; Domain=.github.com; Path=/"
    ]
  });

  t.end();
});
