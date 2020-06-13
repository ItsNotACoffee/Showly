# How to run
1. Clone repository by either downloading directly or by using "git clone URL"
2. Run npm install to install all dependencies
3. Create a nodemon.json file with all env variables needed
4. Run locally with npm run-script start-dev

# Notes
The Procfile is only for Heroku deployment. You also need the following env variables with your data:
- SESSION_SECRET
- IMDB_APIKEY
- EMAIL, EMAIL_PASS
- DB_HOST, DB_USER, DB_DB, DB_PASS