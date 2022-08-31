# NZNewspapers: Scripts

This folder contains scripts used to create or update the JSON files that are used to generate this website.

## The Summarise script (nzn-summarise.js)

The `nzn-summarise.js` script is used to update the datafiles in the `docs/data` folder that are used to generate the homepage (`homeInfo.json`), the Titles page (`titleInfo.json`), the places page (`placeInfo.json`), and the pages for each place (`places/*.json`).

We will re-run these scripts and re-publish the data files when:

- The newspaper data in `docs/data/papers` has been updated, or
- The scripts themselves have been updated and improved.

### Running the script

Before running the script, you will need to install node, then check out the project and make sure your docs/data folder is up-to-date.

The script can then be invoked using node as follows:

    npm run nzn-summarise

The script will regenerate the JSON data in the `docs/data` folder. If the data are changed, you will need to commit them back to GitHub. When they are merged back into the `master` branch they will be publishedto the site by GitHub pages.

### Output files

The following JSON files generated:

- `docsa/data/homeInfo.json`: used to generate the homepage
- `docs/data/titleInfo.json`: used to generate the Titles page
- `docs/data/placeInfo.json`: used to generate the Places, Digitised, and Current pages
- `docs/data/places`: used to generate region, district, and place pages.


## The New Zealand National Bibliography update script (nzn-nat-bib-updater.js)

The `nzn-nat-bib-updater.js` script is used to update the datafiles in the `docs/data` from the latest version of the New Zealand National Bibliography (also known as Publications NZ). 

### Download the data.

You can download the most recent full PublicationsNZ dataset in MARC format from the www.natlib.govt.nz website. You will probably have to Save it then unzip it. Save it in `nznewspapers/scripts/PubsNZ.mrc`.

### Add new records

The script can then be invoked to add new any new records as follows:

    npm run nzn-nat-bib-add

New records will be added in these locations:

- `docs/data/papers`
- `docs/data/marc`

Review the new records and manually fix any data issues.

Then run the summarise script again:

    npm run nzn-summarise

### Update Existing records

    npm run nzn-nat-bib-add
    npm run nzn-summarise

## Other scripts

Other scripts in this folder will be used to make updates to newspaper data itself. There are no current examples.
