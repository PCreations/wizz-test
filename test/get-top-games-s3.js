const assert = require('assert');
const createGetTopGames = require('../get-top-games.s3');

describe('getTopGames', () => {
  it('should return mapped games for both ios and android (happy path)', async () => {
    const iosEntry = [{
      app_id: 1,
      name: 'iOS Game',
      publisher_id: 123,
      bundle_id: 'com.ios.game',
      version: '1.0',
      id: 111,
    }, {}, {}];
    const androidEntry = [{
      app_id: 'a1',
      name: 'Android Game',
      publisher_id: '456',
      bundle_id: 'com.android.game',
      version: '2.0',
      id: '222',
    }, {}, {}];
    const iosArray = [iosEntry];
    const androidArray = [androidEntry];
    const fakeFetch = (url) => Promise.resolve({
      json: () => Promise.resolve(url.includes('ios') ? iosArray : androidArray),
    });
    const getTopGames = createGetTopGames(fakeFetch);
    const games = await getTopGames();

    assert.deepStrictEqual(games[0], {
      name: 'iOS Game',
      publisherId: '123',
      platform: 'ios',
      storeId: '111',
      bundleId: 'com.ios.game',
      appVersion: '1.0',
    });
    assert.deepStrictEqual(games[1], {
      name: 'Android Game',
      publisherId: '456',
      platform: 'android',
      storeId: '222',
      bundleId: 'com.android.game',
      appVersion: '2.0',
    });
  });
});
