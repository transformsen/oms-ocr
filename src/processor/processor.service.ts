/**
 * The ProcessorService.
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as ms from 'ms';

import { CompDbService } from './compdb/compdb.service';
import * as path from 'path';

@Injectable()
export class ProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  
  private nextMsqScanTimerId: NodeJS.Timeout;
  private readonly msqScanInterval: number;
  private readonly mibLocation : string;

  constructor(
    private readonly compDbService: CompDbService,
    configService: ConfigService,
  ) {
    
    this.msqScanInterval = ms(
      configService.get<string>('WM_OMP_MSQ_SCAN_INTERVAL'),
    );
    this.mibLocation =  configService.get<string>('WM_OMP_MIB_LOCATION'); 
    this.doMsqScanStep = this.doMsqScanStep.bind(this);
  }

  onModuleInit() {
    this.nextMsqScanTimerId = setTimeout(this.doMsqScanStep, 0);
  }

  onModuleDestroy() {
    clearTimeout(this.nextMsqScanTimerId);
    this.nextMsqScanTimerId = null;
  }

  /**
   * Gets file from MSQ.
   * @param {string} name Filename.
   * @returns {Promise<string>} Resolves to Base64-encoded file content.
   */
  async getFile(name: string): Promise<string> {
    const filePath = this.getFullFilePath(name);
    const file = fs.readFileSync(filePath, 'base64')
    return file;
  }

  /**
   * Deletes file in MSQ.
   * @param {string} name
   */
  deleteFile(name: string) {
    fs.unlinkSync(this.getFullFilePath(name));
  }

  /**
   * 
   * @param name 
   * @returns string
   */
  getFullFilePath(name: string): string{
    return path.resolve(`${this.mibLocation}/${name}`);
  }

  /**
   * Gets files from MSQ.
   * @param {string} [type] Optional. If specified, only files with this
   *  extension will be included into the response.
   * @returns {Promise<string[]>}
   */
  async getFileNames(type?: string): Promise<string[]> {
    /* Node fs will look for all the files under a directory (MIB_LOCATION) given in environment vraiable. 
     * THis method with Retrun list of files matching the given file type 
     */
    const res = new Promise<string[]>((resolve, reject)=>{
      fs.readdir(path.resolve(this.mibLocation), (err, files)=>{
        if(err){
          reject(`An Error occrred wile reading the directory ${err}`)
        }
        const matchingFiles = []
        for(const file of files){          
          if(!type || file.endsWith(type)){
            matchingFiles.push(file)
          }
        }
        resolve(matchingFiles);
      })     
    })    
    return res;
  }

  /**
   * Performs a single process step, and schedules the next one.
   */
  async doMsqScanStep() {
    try {
      const files = await this.getFileNames('.pdf');
      console.log('MSQ scan: done')
      if (files.length) console.log('Detected PDF files:', files);
      for (let i = 0; i < files.length; i += 1) {
        const fileName = files[i];
        const fileContent = await this.getFile(fileName);
        if (await this.compDbService.receiveFile(fileName, fileContent)) {
          this.deleteFile(fileName);
        }
      }
    } finally {
      if (this.nextMsqScanTimerId) {
        this.nextMsqScanTimerId = setTimeout(
          this.doMsqScanStep,
          this.msqScanInterval,
        )
      }
    }
  }
}
