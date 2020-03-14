import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, createReadStream, unlinkSync } from 'fs';
import { System, CompletionStatus, SuccessStatus, RelationType } from 'src/shared/enums';
import { IJob } from 'src/shared/job.interface';
import { SubmitJobDto } from 'src/api/submit-job.dto';
import { Document, Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose';
import csvParser = require('csv-parser');
import * as path from 'path'

/**
 * OMS OCR processing       
 */
@Injectable()
export class OmsOcrService {

    mibLocation: string;
    baseJobUri: string;
    private version = '1.0';
    private id = 'cdo1234pio';

    constructor(private configService: ConfigService,
        private httpService: HttpService,
        @InjectModel('Job') private jobModel: Model<IJob>,
    ) {
        this.mibLocation = this.configService.get<string>('WM_OMP_MIB_LOCATION');
        this.baseJobUri = this.configService.get<string>('WM_OMP_ROOT_URL_JOB');
    }

    /**
     * 
     * @param fileName 
     * STEP 1 - Create a job for a file
     * STEP 2 - Check for .csv on the same file name
     *         CSV file not available- update the job are failure and return the job
     *         CSV available - Read recepient and formId from csv, update job, return job to combdb
    */
    async process(fileName: string): Promise<Document<IJob>> {
        return new Promise(async (resolve, reject) => {
            const name = fileName.match(/(.*)\.pdf$/i)[1];

            const submitJobDto = this.getSubmitJobDto(name);
            try {
                const updatedJob: IJob = await this.createJobAndCsvProcessing(submitJobDto, name)
                const job: Document<IJob> = await this.jobModel.findOne({
                    name: name,
                }).exec();
                await job.updateOne(updatedJob);
                resolve(job);
            } catch (error) {
                reject(`OMS-OCR Failed ${error}`)
            }
        })

    }

    /**
     * 
     * @param submitJobDto 
     * @param name 
     * @returns Promise<IJob>
     * Create job by invoke the job end point
     * IF CSV file available - Parse the CSV and update the job, then delete the CSV file
     * IF CSV file not available - Marked Job as failure and return job
     */
    async createJobAndCsvProcessing(submitJobDto: SubmitJobDto, name: string): Promise<IJob> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.httpService.post(`${this.baseJobUri}/job`, submitJobDto).toPromise()
                //path.resolve for handling directory and UNC directory
                const csvFileFullPath = path.resolve(`${this.mibLocation}/${name}.csv`)
                const now = new Date()
                let updatedJob: IJob = null;
                updatedJob = {
                    ...submitJobDto,
                    id: this.id,
                    created: now,
                    finishedAt: undefined,
                    requestedSendDate: now,
                    tasks: undefined,
                    taskOrder: [],
                    completionStatus: CompletionStatus.Incomplete,
                    overallStatus: SuccessStatus.NotAttempted,
                    lastProcessingAttempt: undefined
                }
                if (existsSync(csvFileFullPath)) {
                    const csvData = await this.parseCSV(csvFileFullPath);
                    updatedJob.recipient = csvData.recipient;
                    updatedJob.relationships[0].conf.formId = csvData.formId;
                    unlinkSync(csvFileFullPath)
                } else {
                    updatedJob.completionStatus = CompletionStatus.Complete;
                    updatedJob.overallStatus = SuccessStatus.Failure;
                    updatedJob.finishedAt = new Date();
                    console.log('CSV File not found, Marking Job as Complated/Failure')
                }
                resolve(updatedJob);
            } catch (error) {
                reject(`Job Creation or CSV Processing failed ${error}`)
            }
        })

    }
    /**
     * 
     * @param name 
     * @returns SubmitJobDto
     * Return SubmitJobDto with basic info for creating the job
     */
    getSubmitJobDto(name: string): SubmitJobDto {
        const item = {
            contentType: 'application/pdf',
            encodingType: 'base64',
            content: undefined,
        }
        const system = {
            name: System.OMS,
            version: this.version,
            stagingEnvironment: this.configService.get<string>('NODE_ENV'),
            datacenterEnvironment: this.configService.get<string>('DATACENTER_ENV')
        }
        const conf = { sourceSystemType: System.OMS, formId: '', id: null, catalogId: null }
        const recipient = {
            addressee: '', addressLine1: '', addressLine2: '', city: '', state: '',
            zip: '',
            zip4: ''
        }
        const submitJobDto: SubmitJobDto = {
            version: this.version,
            requestContext: {
                source: {
                    system: system,
                    user: {
                        id: this.id
                    },
                }
            },
            name: name,
            recipient: recipient,
            item: item,
            storage: {
                system: System.OMS,
                conf: {
                    locationId: '',
                    locationName: ''
                }
            },
            relationships: [{
                    type: RelationType.CONTENT_SOURCE,
                    conf: conf
                }
            ]
        }
        return submitJobDto;
    }
    /**
     * 
     * @param file 
     * @returns Promise
     * Parse the CSV file and return recipient and formId in single object as a promise
     */
    parseCSV(file): Promise<any> {
        return new Promise((resolve, reject) => {
            try{
                const results = []
                createReadStream(file)
                    .pipe(csvParser())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        resolve(this.unPackAddress(results))
                    });
            }catch(error){
                reject(`Error while pasring the CSV ${error}`)
            }
            
        })
    }
    /**
     * 
     * @param csvData 
     * Up pack the csv object to { recipient, formId }
     */
    unPackAddress(csvData: any[]): any {
        if (csvData.length < 1) {
            throw 'Invalid Address received'
        }
        const csvInfo = csvData[0]
        const recipient = {
            addressee: csvInfo['AddressBlock.Line1'],
            addressLine1: csvInfo['AddressBlock.Line2'],
            addressLine2: csvInfo['AddressBlock.Line3'],
            city: csvInfo['AddressBlock.Line4'],
            state: csvInfo['AddressBlock.Line5'],
            zip: csvInfo['AddressBlock.Line6'],
            zip4: ''
        }
        const formId = csvInfo['FormID.Left'] + csvInfo['FormID.Right']
        return { recipient, formId };
    }
}
