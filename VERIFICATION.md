# Wellmark CIM - Outbound Mail Processor/API - OMS - OCR
*This Document is created for verifying*
- OMS OCR Process
- Using fs for getting the files.(Local and UNC)
- Checking new field - finishAt added to the job
- Restructing of the Upload and Event Clients call

### Content
- [Prerequisites](#prerequisites)
- [Installation & Config](#installation-config)
- [Verification](#verification)

### Prerequisites
- [Node 12](https://nodejs.org/en/) - consider to install it via
  [NVM](https://github.com/nvm-sh/nvm)
- For local development you will also need:
  - [MongoDB 4](https://www.mongodb.com/download-center/community), and
    (optionally) [MongoDB Compass](https://www.mongodb.com/products/compass) -
    GUI MongoDB Client.
  - (optionally) [Postman](https://www.postman.com/)
  - (optionally) a local shared folder (see verification section below for
    setup instructions).

### Installation & Config

- Install NPM dependencies, executing in the codebase root folder:
  ```
  $ npm install
  ```

- Additional default configuration are added into the [`.env`](.env) file.
  | Variable | Value |
  | --- | --- |
  | `WM_OMP_MIB_LOCATION` | Location of MIB files. Local directory or UNC directory, e.g. `\\DESKTOP-IRI51JI\unc_folder` or `./mnt`. |
  | `WM_OMP_ROOT_URL_JOB` | Root URL for Job creation API. Job creation api has been reused for creating the job on OMS - ORC Process. e.g. `http://localhost:3000` |
  | `NODE_ENV` | Node enviroment where this job is running. e.g. `development` |
  | `DATACENTER_ENV` | Date Center enviroment where this job is running. e.g. `us-west-2` |

  Any of these settings can be overriden by defining an environment variable of
  the same name.
    
  # development mode
  $ npm start

  # watch mode (development + auto restart on code changes)
  $ npm run start:dev

  # production mode
  $ npm run start:prod
  ```

### Verification
- To test local directory and UNC path:
  - Local Directory 
    - There are 2 test files available under ./mnt for processing
    - For further testing - Copy the sample test files under ./doc/mib to ./mnt - for testing with local directory
  - UNC Directory 
    - Create UNC directory in your computer. Hint - [How to create UNC](https://knowledge.autodesk.com/support/3ds-max/learn-explore/caas/sfdcarticles/sfdcarticles/How-to-assign-a-path-using-the-Universal-Naming-Convention-UNC.html) 
    - Update the UNC path to environment variaable WM_OMP_MIB_LOCATION. Example UNC path (\\DESKTOP-IRI51JI\unc_folder) 
    - Copy the file from ./doc/mib to UNC folder
    - Restart the application npm run start:dev
    - HINT - path.resolve with fs - will work for both local directory and UNC

- finishedAt added to the job. You can this from Mongo DB document

- Restructuring - Mock API will be invoked from client service files

- OMS OCR
    - Add only PDF file to ./mnt or UNC directory. Check MongoDB document under jobs collection. New job should create and marked as COMPLETED and FAILURE
    - Add both PDF and CSV file to ./mnt or UNC directory. Check MongoDB document under jobs collection. New job should create and marked as COMPLETED and SUCCESS. Other 2 Workflow TASK should be updated in jobs and both of them should marked to their respective statuses.