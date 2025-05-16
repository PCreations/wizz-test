const { z } = require('zod');

const iosTopGameSchema = z.object({
  app_id: z.number(),
  name: z.string(),
  publisher_id: z.number(),
  bundle_id: z.string(),
  version: z.string(),
  id: z.number(), // I guess that the storeId
});

const androidTopGameSchema = z.object({
  app_id: z.string(),
  name: z.string(),
  publisher_id: z.string(),
  bundle_id: z.string(),
  version: z.string(),
  id: z.string(), // I guess that the storeId
});

const mapIosS3topGameResultToDbGame = (iosS3topGameResultEntry) => {
  if (!Array.isArray(iosS3topGameResultEntry)) {
    console.error('iosS3topGameResultEntry is not an array', iosS3topGameResultEntry);
    return {};
  }

  const firstGameEntry = iosS3topGameResultEntry[0];

  const parsedGameEntry = iosTopGameSchema.safeParse(firstGameEntry);

  if (!parsedGameEntry.success) {
    console.error('iosS3topGameResultEntry is not a valid ios top game', parsedGameEntry.error);
    return {};
  }

  return {
    name: parsedGameEntry.data.name,
    publisherId: `${parsedGameEntry.data.publisher_id}`,
    platform: 'ios',
    storeId: `${parsedGameEntry.data.id}`,
    bundleId: parsedGameEntry.data.bundle_id,
    appVersion: parsedGameEntry.data.version,
  };
};

const mapAndroidS3topGameResultToDbGame = (androidS3topGameResultEntry) => {
  if (!Array.isArray(androidS3topGameResultEntry)) {
    console.error('androidS3topGameResultEntry is not an array', androidS3topGameResultEntry);
    return {};
  }

  const firstGameEntry = androidS3topGameResultEntry[0];

  const parsedGameEntry = androidTopGameSchema.safeParse(firstGameEntry);

  if (!parsedGameEntry.success) {
    console.error('androidS3topGameResultEntry is not a valid android top game', parsedGameEntry.error);
    return {};
  }

  return {
    name: parsedGameEntry.data.name,
    publisherId: parsedGameEntry.data.publisher_id,
    platform: 'android',
    storeId: parsedGameEntry.data.id,
    bundleId: parsedGameEntry.data.bundle_id,
    appVersion: parsedGameEntry.data.version,
  };
};

const createGetTopGames = (fetch = global.fetch) => async () => {
  const [iosGamesResult, androidGamesResult] = await Promise.allSettled([
    fetch('https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/ios.top100.json')
      .then((res) => res.json()).then((data) => (Array.isArray(data) ? data : [])),
    fetch('https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/android.top100.json')
      .then((res) => res.json()).then((data) => (Array.isArray(data) ? data : [])),
  ]);

  const iosGames =
    iosGamesResult.status === 'fulfilled' ? iosGamesResult.value.map(mapIosS3topGameResultToDbGame) : [];
  const androidGames =
    androidGamesResult.status === 'fulfilled' ?
      androidGamesResult.value.map(mapAndroidS3topGameResultToDbGame) :
      [];

  return [...iosGames, ...androidGames];
};

module.exports = createGetTopGames;
