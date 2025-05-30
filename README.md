# Candidate Takehome Exercise
This is a simple backend engineer take-home test to help assess candidate skills and practices.  We appreciate your interest in Voodoo and have created this exercise as a tool to learn more about how you practice your craft in a realistic environment.  This is a test of your coding ability, but more importantly it is also a test of your overall practices.

If you are a seasoned Node.js developer, the coding portion of this exercise should take no more than 1-2 hours to complete.  Depending on your level of familiarity with Node.js, Express, and Sequelize, it may not be possible to finish in 2 hours, but you should not spend more than 2 hours.  

We value your time, and you should too.  If you reach the 2 hour mark, save your progress and we can discuss what you were able to accomplish. 

The theory portions of this test are more open-ended.  It is up to you how much time you spend addressing these questions.  We recommend spending less than 1 hour.  


For the record, we are not testing to see how much free time you have, so there will be no extra credit for monumental time investments.  We are looking for concise, clear answers that demonstrate domain expertise.

# Project Overview
This project is a simple game database and consists of 2 components.  

The first component is a VueJS UI that communicates with an API and renders data in a simple browser-based UI.

The second component is an Express-based API server that queries and delivers data from an SQLite data source, using the Sequelize ORM.

This code is not necessarily representative of what you would find in a Voodoo production-ready codebase.  However, this type of stack is in regular use at Voodoo.

# Project Setup
You will need to have Node.js, NPM, and git installed locally.  You should not need anything else.

To get started, initialize a local git repo by going into the root of this project and running `git init`.  Then run `git add .` to add all of the relevant files.  Then `git commit` to complete the repo setup.  You will send us this repo as your final product.
  
Next, in a terminal, run `npm install` from the project root to initialize your dependencies.

Finally, to start the application, navigate to the project root in a terminal window and execute `npm start`

You should now be able to navigate to http://localhost:3000 and view the UI.

You should also be able to communicate with the API at http://localhost:3000/api/games

If you get an error like this when trying to build the project: `ERROR: Please install sqlite3 package manually` you should run `npm rebuild` from the project root.

# Practical Assignments
Pretend for a moment that you have been hired to work at Voodoo.  You have grabbed your first tickets to work on an internal game database application. 

#### FEATURE A: Add Search to Game Database
The main users of the Game Database have requested that we add a search feature that will allow them to search by name and/or by platform.  The front end team has already created UI for these features and all that remains is for the API to implement the expected interface.  The new UI can be seen at `/search.html`

The new UI sends 2 parameters via POST to a non-existent path on the API, `/api/games/search`

The parameters that are sent are `name` and `platform` and the expected behavior is to return results that match the platform and match or partially match the name string.  If no search has been specified, then the results should include everything (just like it does now).

Once the new API method is in place, we can move `search.html` to `index.html` and remove `search.html` from the repo.

#### FEATURE B: Populate your database with the top 100 apps
Add a populate button that calls a new route `/api/games/populate`. This route should populate your database with the top 100 games in the App Store and Google Play Store.
To do this, our data team have put in place 2 files at your disposal in an S3 bucket in JSON format:

- https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/ios.top100.json
- https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/android.top100.json

# Theory Assignments
You should complete these only after you have completed the practical assignments.

The business goal of the game database is to provide an internal service to get data for all apps from all app stores.  
Many other applications at Voodoo will use consume this API.

#### Question 1:
We are planning to put this project in production. According to you, what are the missing pieces to make this project production ready? 
Please elaborate an action plan.

- Create a continuous delivery pipeline with at least a commit stage where all fast tests run, alongside linting for example.
- Fix the tests, right now they are dependant on each other, a proper beforeEach / afterEach strategy would be beneficial.
- Since the DB is sqlite, the end-to-end tests are very fast, but they will not be as fast when changing DB for a "real" database other that a flat file.
- Hence the need to decide on a proper test strategy to alleviate this issue.
- Deploy the app where you see fit. Might be a simple VPC or a cloud function or anything else really.
- Decide on a database strategy other than the very limiting sqlite.
- There should be some logging and error tracking tools to enable production monitoring and observability (tools like Sentry, Rollbar, etc.)
- The API should be protected through authentication and authorization
- Express is no longer maintained, a migration towards Fastify should be planned to avoid potential memory leaks and vulnerability
- The code is quite procedural right now. It might not be an issue if the project is not intended to grow, but if it has  to evolve, the code should be refactored into a more modular way to enchance testability and maintainability.
- A word of caution : the API returns arrays, it prevents us to make change to the API response in a backward compatible manner. API repsonse should always be object to be able to add properties if needed without breaking the existing clients.
- The API should be paginated
- The populate endpoint has no size limit right now, checks should be added here to avoid memory overflow, and if this endpoint should be able to handle large files, a streaming approach would be preferable.


#### Question 2:
Let's pretend our data team is now delivering new files every day into the S3 bucket, and our service needs to ingest those files
every day through the populate API. Could you describe a suitable solution to automate this? Feel free to propose architectural changes.

- I wouldn't use the API direclty to do that. We can respond to some S3 events when the files is updated, in a worker that calls the same logic that the one actually written directly in the route (thus extracting this logic inside its own logic in a service for example).
- Depending on the fault tolerance, I wouldn't go to crazy with this, a simple retry policy in case of failure could do the job, while bulk-creating the games inside a transaction. It depedns on the requirements.
- An even simpler solution would be to just pull the data once a day if it fits the functional requirements.
- If the data has to be ingested realtime, responding to an S3 event when file is updated would be simpler. A simple solution could be to simply create an aws lambda that pushes a message into a cloud pubsub topic (since you're on GCP), and this topic could be consumed by the worker ingesting data.


