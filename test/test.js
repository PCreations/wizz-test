const request = require('supertest');
const assert = require('assert');
const buildApp = require('../app');

const app = buildApp();

const baseGameData = {
  publisherId: '1234567890',
  storeId: '1234',
  bundleId: 'test.bundle.id',
  appVersion: '1.0.0',
  isPublished: true,
};

const seedGame = (data = {
  name: 'Test App',
  platform: 'ios',
}) => request(app)
  .post('/api/games')
  .send({
    ...data,
    ...baseGameData,
  })
  .set('Accept', 'application/json')
  .then((result) => result.body.id);

const expectResultToMatchGame = (resultGame, { name, platform, ...overrides }) => {
  assert.notStrictEqual(resultGame, undefined, 'resultGame should not be undefined');
  assert.strictEqual(resultGame.name, name);
  assert.strictEqual(resultGame.platform, platform);
  assert.strictEqual(resultGame.publisherId, overrides.publisherId ?? baseGameData.publisherId);
  assert.strictEqual(resultGame.storeId, overrides.storeId ?? baseGameData.storeId);
  assert.strictEqual(resultGame.bundleId, overrides.bundleId ?? baseGameData.bundleId);
  assert.strictEqual(resultGame.appVersion, overrides.appVersion ?? baseGameData.appVersion);
  assert.strictEqual(resultGame.isPublished, overrides.isPublished ?? baseGameData.isPublished);
};

/**
 * Testing create game endpoint
 */
describe('POST /api/games', () => {
  const data = {
    publisherId: '1234567890',
    name: 'Test App',
    platform: 'ios',
    storeId: '1234',
    bundleId: 'test.bundle.id',
    appVersion: '1.0.0',
    isPublished: true,
  };
  it('respond with 200 and an object that matches what we created', (done) => {
    request(app)
      .post('/api/games')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.publisherId, '1234567890');
        assert.strictEqual(result.body.name, 'Test App');
        assert.strictEqual(result.body.platform, 'ios');
        assert.strictEqual(result.body.storeId, '1234');
        assert.strictEqual(result.body.bundleId, 'test.bundle.id');
        assert.strictEqual(result.body.appVersion, '1.0.0');
        assert.strictEqual(result.body.isPublished, true);
        done();
      });
  });
});

/**
 * Testing get all games endpoint
 */
describe('GET /api/games', () => {
  it('respond with json containing a list that includes the game we just created', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        console.log('***Result', JSON.stringify(result.body, null, 2));
        assert.strictEqual(result.body[0].publisherId, '1234567890');
        assert.strictEqual(result.body[0].name, 'Test App');
        assert.strictEqual(result.body[0].platform, 'ios');
        assert.strictEqual(result.body[0].storeId, '1234');
        assert.strictEqual(result.body[0].bundleId, 'test.bundle.id');
        assert.strictEqual(result.body[0].appVersion, '1.0.0');
        assert.strictEqual(result.body[0].isPublished, true);
        done();
      });
  });
});

/**
 * Testing update game endpoint
 */
describe('PUT /api/games/1', () => {
  const data = {
    id: 1,
    publisherId: '999000999',
    name: 'Test App Updated',
    platform: 'android',
    storeId: '5678',
    bundleId: 'test.newBundle.id',
    appVersion: '1.0.1',
    isPublished: false,
  };
  it('respond with 200 and an updated object', (done) => {
    request(app)
      .put('/api/games/1')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.publisherId, '999000999');
        assert.strictEqual(result.body.name, 'Test App Updated');
        assert.strictEqual(result.body.platform, 'android');
        assert.strictEqual(result.body.storeId, '5678');
        assert.strictEqual(result.body.bundleId, 'test.newBundle.id');
        assert.strictEqual(result.body.appVersion, '1.0.1');
        assert.strictEqual(result.body.isPublished, false);
        done();
      });
  });
});

/**
 * Testing update game endpoint
 */
describe('DELETE /api/games/1', () => {
  it('respond with 200', (done) => {
    request(app)
      .delete('/api/games/1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        done();
      });
  });
});

/**
 * Testing get all games endpoint
 */
describe('GET /api/games', () => {
  it('respond with json containing no games', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 0);
        done();
      });
  });
});

/**
 * Testing search game endpoint
 */
describe('POST /api/search', () => {
  const gameIds = [];
  beforeEach(async () => {
    gameIds.push(await seedGame({
      name: 'IOS App Search',
      platform: 'ios',
    }));
    gameIds.push(await seedGame({
      name: 'Foo Baz',
      platform: 'ios',
    }));
    gameIds.push(await seedGame({
      name: 'Android App Search',
      platform: 'android',
    }));
  });

  afterEach(async () => {
    await Promise.all(gameIds.map(async (gameId) => {
      await request(app)
        .delete(`/api/games/${gameId}`)
        .set('Accept', 'application/json')
        .expect(200);
    }));
  });

  it('respond with everything if no platform or name is provided', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'IOS App Search',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[1], {
      name: 'Foo Baz',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[2], {
      name: 'Android App Search',
      platform: 'android',
    });
  });

  it('respond with json containing matching platforms games for ios', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({ platform: 'ios' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'IOS App Search',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[1], {
      name: 'Foo Baz',
      platform: 'ios',
    });
  });

  it('respond with json containing matching platforms games for android', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({ platform: 'android' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'Android App Search',
      platform: 'android',
    });
  });

  it('respond with all games when no platform is empty is provided', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({
        platform: '',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'IOS App Search',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[1], {
      name: 'Foo Baz',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[2], {
      name: 'Android App Search',
      platform: 'android',
    });
  });

  it('respond with json containing games matching query', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({ name: 'app' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'IOS App Search',
      platform: 'ios',
    });
    expectResultToMatchGame(result.body[1], {
      name: 'Android App Search',
      platform: 'android',
    });
  });

  it('respond with json containing games matching query and platform', async () => {
    const result = await request(app)
      .post('/api/games/search')
      .send({ name: 'app', platform: 'ios' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expectResultToMatchGame(result.body[0], {
      name: 'IOS App Search',
      platform: 'ios',
    });
    assert.strictEqual(result.body.length, 1);
  });
});

describe('POST /api/games/populate', () => {
  const gameIds = [];
  let appWithStubbedTopGames;

  afterEach(async () => {
    await Promise.all(gameIds.map(async (gameId) => {
      await request(app)
        .delete(`/api/games/${gameId}`)
        .set('Accept', 'application/json')
        .expect(200);
    }));
  });

  it('respond with 201 and populate the database with top android and ios games', async () => {
    const androidGame1 = {
      name: 'Android Game 1',
      platform: 'android',
      storeId: '1234',
      bundleId: 'ag1.bundle.id',
      publisherId: '1234567890',
      appVersion: '1.0.0',
      isPublished: true,
    };
    const androidGame2 = {
      name: 'Android Game 2',
      platform: 'android',
      storeId: '4567',
      bundleId: 'ag2.bundle.id',
      appVersion: '1.1.0',
      publisherId: '234567890',
      isPublished: true,
    };
    const iosGame1 = {
      name: 'IOS Game 1',
      platform: 'ios',
      storeId: '2345',
      bundleId: 'ig1.bundle.id',
      appVersion: '2.0.0',
      publisherId: '34567890',
      isPublished: true,
    };
    const iosGame2 = {
      name: 'IOS Game 2',
      platform: 'ios',
      storeId: '3456',
      bundleId: 'ig2.bundle.id',
      appVersion: '2.1.0',
      publisherId: '4567890',
      isPublished: true,
    };
    const topGames = [androidGame1, androidGame2, iosGame1, iosGame2]
    appWithStubbedTopGames = buildApp({
      getTopGames: () => Promise.resolve(topGames),
      port: 3001,
    });

    const populateResult = await request(appWithStubbedTopGames)
      .post('/api/games/populate')
      .expect(201);
    gameIds.push(...populateResult.body);

    const result = await request(appWithStubbedTopGames)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    assert.strictEqual(result.body.length, 4);
    result.body.forEach((resultGame, index) => {
     expectResultToMatchGame(resultGame, topGames[index]);
    });
  });

  it('does not duplicate games', async () => {
    const androidGame1 = {
      name: 'Android Game 1',
      platform: 'android',
      storeId: '1234',
      bundleId: 'ag1.bundle.id',
      publisherId: '1234567890',
      appVersion: '1.0.0',
      isPublished: true,
    };
    await seedGame(androidGame1);
    const topGames = [androidGame1]
    appWithStubbedTopGames = buildApp({
      getTopGames: () => Promise.resolve(topGames),
      port: 3002,
    });

    const populateResult = await request(appWithStubbedTopGames)
      .post('/api/games/populate')
      .expect(201);
    gameIds.push(...populateResult.body);

    const result = await request(appWithStubbedTopGames)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    assert.strictEqual(result.body.length, 1);
  });
});
