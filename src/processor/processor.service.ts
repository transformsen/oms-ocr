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
import * as os from 'os';
import * as ms from 'ms';
import * as Samba from 'samba-client';
import { v4 as uuid } from 'uuid';

import { CompDbService } from './compdb/compdb.service';

@Injectable()
export class ProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  private samba: Samba;
  private nextMsqScanTimerId: NodeJS.Timeout;
  private readonly msqScanInterval: number;

  constructor(
    private readonly compDbService: CompDbService,
    configService: ConfigService,
  ) {
    this.samba = new Samba({
      address: configService.get<string>('WM_OMP_MSQ_SHARE'),
      username: configService.get<string>('WM_OMP_MSQ_USERNAME'),
      password: configService.get<string>('WM_OMP_MSQ_PASSWORD'),
    });
    this.msqScanInterval = ms(
      configService.get<string>('WM_OMP_MSQ_SCAN_INTERVAL'),
    );
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
    const tmpPath = `${os.tmpdir()}/${uuid()}`;
    await this.samba.getFile(name, tmpPath);
    const file = fs.readFileSync(tmpPath, 'base64')
    fs.unlinkSync(tmpPath);
    return file;
  }

  /**
   * Deletes file in MSQ.
   * @param {string} name
   * @returns {Promise}
   */
  async deleteFile(name: string) {
    await this.samba.deleteFile(name);
  }

  /**
   * Gets files from MSQ.
   * @param {string} [type] Optional. If specified, only files with this
   *  extension will be included into the response.
   * @returns {Promise<string[]>}
   */
  async getFileNames(type?: string): Promise<string[]> {
    /* The deal here is: the best Samba client for Node I found is just
     * a simple wrapper for the native `smbclient` tool, and for dir operaiton
     * it just returns the plain text output of `smbclient` as is, thus some
     * parsing is necessary here. */
    const NAME_TYPE_SIZE_REGEX = /(.+) +(\w) +(\d+)/;
    const DATE_TIME_REGEX = /(\w{3} \w{3} +\d+ \d{2}:\d{2}:\d{2} \d{4})/;
    const REGEX = new RegExp(
      `${NAME_TYPE_SIZE_REGEX.source} +${DATE_TIME_REGEX.source}$`
    );
    const files = (await this.samba.dir('')).split('\n');
    const res = [];
    for (let i = 0; i < files.indexOf(''); i += 1) {
      const [, unTrimedName, fileType] = files[i].match(REGEX);
      if (fileType !== 'D') {
        const name = unTrimedName.trim();
        if (!type || name.toLowerCase().endsWith(type)) res.push(name);
      }
    }
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
          await this.deleteFile(fileName);
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
