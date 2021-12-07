# NZNewspapers: Scripts

This folder contains scripts used to create or update JSON files in the `docs/data` folder that are used to generate the homepage and browsing pages of the website (i.e. `homeInfo.json`, `titleInfo.json`, etc).

You should re-run these scripts when they have been updated, or the

- You've updated the scripts
- The newspaper data in `docs/data/papers` has been updated.

## Running the scripts

The main script is nzn-summarise.js and you should invokre it as follows:

    npm run nzn-summarise

The script will regenerate the JSON data in the `docs/data` folder. If the data are changed, you will need to commit then to github. When they are merged into the `master` branch they will be use din the site.

## Generated files

The following JSON files re generated:

- `docsa/data/homeInfo.json`: used to generate the homepage
- `docs/data/titleInfo.json`: used to generate the Titles page
- `docs/data/places`: used to generate region, district, and place pages.
