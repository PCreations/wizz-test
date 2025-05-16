const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const createGetTopGamesFromS3 = require('./get-top-games.s3');

const buildApp = (deps = {}) => {
  const { getTopGames = createGetTopGamesFromS3(), port = 3000 } = deps;
  const app = express();

  app.use(bodyParser.json());
  app.use(express.static(`${__dirname}/static`));

  app.get('/api/games', (req, res) => db.Game.findAll()
    .then((games) => res.send(games))
    .catch((err) => {
      console.log('There was an error querying games', JSON.stringify(err));
      return res.send(err);
    }));

  app.post('/api/games', (req, res) => {
    const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
    return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
      .then((game) => res.send(game))
      .catch((err) => {
        console.log('***There was an error creating a game', JSON.stringify(err));
        return res.status(400).send(err);
      });
  });

  app.delete('/api/games/:id', (req, res) => {
    // eslint-disable-next-line radix
    const id = parseInt(req.params.id);
    return db.Game.findByPk(id)
      .then((game) => game?.destroy({ force: true }))
      .then(() => res.send({ id }))
      .catch((err) => {
        console.error(err);
        console.log('***Error deleting game', JSON.stringify(err));
        res.status(400).send(err);
      });
  });

  app.put('/api/games/:id', (req, res) => {
    // eslint-disable-next-line radix
    const id = parseInt(req.params.id);
    return db.Game.findByPk(id)
      .then((game) => {
        const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
        return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
          .then(() => res.send(game))
          .catch((err) => {
            console.log('***Error updating game', JSON.stringify(err));
            res.status(400).send(err);
          });
      });
  });

  app.post('/api/games/search', (req, res) => {
    const { platform, name } = req.body;
  
    const whereClause = {};
    
    if (platform) {
      whereClause.platform = platform;
    }
    
    if (name) {
      whereClause.name = {
        [db.Sequelize.Op.like]: `%${name}%`
      };
    }
    
    return db.Game.findAll({ 
      where: whereClause
    })
    .then((games) => {
      return res.send(games);
    })
    .catch((err) => {
      console.log('***Error searching games', JSON.stringify(err));
      res.status(400).send(err);
    });
  });

  app.post('/api/games/populate', (_, res) => {
    return getTopGames()
      .then(async (games) => {
        const storeIds = games.map(game => game.storeId);

        // SQLite does not support updateOnDuplicate, so we need to handle duplicates manually
        const existingGames = await db.Game.findAll({
          where: {
            storeId: { [db.Sequelize.Op.in]: storeIds }
          },
        });
        
        const existingGameMap = new Map();
        existingGames.forEach(game => {
          const key = `${game.storeId}-${game.platform}`;
          existingGameMap.set(key, game);
        });
        
        
        const newGames = [];
        let gameIds = [];
        
        games.forEach(game => {
          const key = `${game.storeId}-${game.platform}`;
          if (existingGameMap.has(key)) {
            return;
          }
          newGames.push(game);
        });
        
        if (newGames.length > 0) {
          const createdGames = await db.Game.bulkCreate(newGames);
          gameIds = createdGames.map(game => game.id);
        }
        
        console.log(`***Successfully populated ${gameIds.length} games (${newGames.length} new)`);
        return res.status(201).send(gameIds);
      })
      .catch((err) => {
        console.error(err);
        console.log('***Error populating games', JSON.stringify(err));
        res.status(400).send(err);
      });
  });

  app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
  });

  return app;
};

module.exports = buildApp
