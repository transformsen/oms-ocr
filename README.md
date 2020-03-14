# Wellmark CIM - Outbound Mail Processor/API
*Please check VERIFICATION.md created for this challenge*
*Updated this file for consolidated verification of end to end*

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

- Verify default configuration in the [`.env`](.env) file.
  | Variable | Value |
  | --- | --- |
  | `WM_OMP_MONGODB_URL` | MongodDB connection URL. [Its format documented here](https://docs.mongodb.com/manual/reference/connection-string/#standard-connection-string-format), and it is preset to the defaul connection URL of a local MongoDB instance. |
  | `WM_OMP_MSQ_SHARE` | Path to the shared (network) MSQ folder. It should be `//hostname/path`, e.g. for locally setup shared folder for testing, it will be `//localhost/foldername`. |
  | `WM_OMP_MSQ_USERNAME` | Username for MSQ folder access, if any. |
  | `WM_OMP_MSQ_PASSWORD` | Password for MSQ folder access, if any. |
  | `WM_OMP_MSQ_SCAN_INTERVAL` | Time interval between MSQ polling by processor, in [`zeit/ms`](https://github.com/zeit/ms) format, e.g. `30s`. |
  | `WM_OMP_PROCESSING_ATTEMPTS_MAX` | The maximum number of attempts after which a task, and the job containing it, are considered failed. |
  | `WM_OMP_TASK_PROCESSING_SPAN_MINUTES` | The time [min] between retries of failed tasks |
  | `WM_OMP_TTL_MINUTES` | The time [min] after which a job is marked failed if it has not got necessary artifacts. |
  | `WM_OMP_ROOT_URI_DMS` | Root URL of DMS API. The codebase includes a simple mock available at `http://localhost:3000/mocks` base URL. |
  | `WM_OMP_ROOT_URI_EVENT_API` | Root URL of Event API. The codebase includes a simple mock available at `http://localhost:3000/mocks` base URL. |  
  | `WM_OMP_BODY_LIMIT` | The maximum payload size of POST endpoints exposed by API, e.g. `10mb`. |
  | `WM_OMP_MIB_LOCATION` | Location of MIB files. Local directory or UNC directory, e.g. `\\DESKTOP-IRI51JI\unc_folder` or `./mnt`. |
  | `WM_OMP_ROOT_URL_JOB` | Root URL for Job creation API. Job creation api has been reused for creating the job on OMS - ORC Process. e.g. `http://localhost:3000` |
  | `NODE_ENV` | Node enviroment where this job is running. e.g. `development` |
  | `DATACENTER_ENV` | Date Center enviroment where this job is running. e.g. `us-west-2` |

  Any of these settings can be overriden by defining an environment variable of
  the same name.
  
  Also, you may create another environment file (e.g. `.secret.env`, which is  also ignored in `.gitignore`), and run the API the following way
  to use it instead of `.env`:
  ```
  $ WM_OMP_CONFIG_ENV=".secret" npm start
  ```
- To run API, and job processor in different modes use one of the following
  commands. If you want to rely on local MongoDB and MSQ shared folder, see
  additional instructions in the verification section below on how to configure
  and run them before API & processor.
  ```bash
  # development mode
  $ npm start

  # watch mode (development + auto restart on code changes)
  $ npm run start:dev

  # production mode
  $ npm run start:prod
  ```
*Please check VERIFICATION.md created for this challenge*
*Updated this file for consolidated verification of end to end*
### Verification

- The local MongoDB instance by default is started as
  ```
  $ monogod --dbpath /path/to/db
  ```

- To test local directory and UNC path:

  - Local Directory 
    - Copy the files under ./doc/mib to ./mnt - for testing with local directory
  - UNC Directory 
    - Create UNC directory in your computer. Hint - [How to create UNC](https://knowledge.autodesk.com/support/3ds-max/learn-explore/caas/sfdcarticles/sfdcarticles/How-to-assign-a-path-using-the-Universal-Naming-Convention-UNC.html) 
    - Update the UNC path to environment variaable WM_OMP_MIB_LOCATION. Example UNC path (\\DESKTOP-IRI51JI\unc_folder) 
    - Restart the application npm run start:dev
- Load Postman collection and environment for the API from
  [`/docs/postman/wm_omp.postman_collection.json`](docs/postman/wm_omp.postman_collection.json) and [`/docs/postman/wm_omp.postman_environment.json`](docs/postman/wm_omp.postman_environment.json).

- Also connect to DB with MongoDB Compass to monitor DB content.

- Start API and processor.

- Postman collection contains a single `POST /job` command, which sends to
  API a valid job with name `CIM_DEV_B-9619649_IOI4444444_1581447908`. Send it.
  To send another job, you need to update the name, as duplicated name values
  are forbidden by validation (it was not mentioned in specs explicitly, but
  the logic described there requires job names to be unique). You will see
  the job added to DB with `INCOMPLETE` / `NON_ATTEMPTED` statuses, and no
  tasks scheduled.

- Get any PDF file, name it to match a job name, e.g.
  `CIM_DEV_B-9619649_IOI4444444_1581447908.pdf`, and copy it into
  the shared folder. Wait for processor to pick it up (by default,
  it checks the folder every 30 seconds). As it picks up the file,
  it will pass it to compdb component, which will associated it with
  the job, schedule two tasks, and executes these tasks, as specified
  in the challenge documentation. Notice that mock DMS and Event API
  endpoints, implemented as a temporary part of the codebase, print to
  the console the received payload each time they are triggered.

- To simulate a task failure, if you rely on the mock DMS and Event API,
  as the codebase is setup by default, just go into
  [`/src/mock-api/mock-api.controller.ts`](src/mock-api/mock-api.controller.ts)
  and change a mock endpoint URL. If you don't run the API in watch mode -
  restart it manually. Now, if you repeat the operations described above
  to create and trigger a new job, the task relying on that endpoint will
  fail, and thus you can verify processor behavior in fault scenarios.

- finishedAt added to the job. You can this from Mongo DB document

- Mock API will be invoked from client service files

- Start API and processor.

- OMS OCR
    - Add only PDF file to ./mnt or UNC directory. Check MongoDB document under jobs collection. New job should create and marked as COMPLETED and FAILURE
    - Add both PDF and CSV file to ./mnt or UNC directory. Check MongoDB document under jobs collection. New job should create and marked as COMPLETED and SUCCESS. Other 2 Workflow TASK should be updated in jobs and both of them should marked to their respective statuses.
