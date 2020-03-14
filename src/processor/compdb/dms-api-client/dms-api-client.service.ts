import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DMSUpload } from 'src/shared/dms.upload.interface';

@Injectable()
export class DMSApiClientService {
    private baseApiUrl: string;
    constructor(configService: ConfigService,
        private httpService: HttpService){
            this.baseApiUrl = configService.get<string>(
                'WM_OMP_ROOT_URI_DMS',
              );
        }
    
    upload(dmsUploadArray: DMSUpload[]): Promise<any>{
      const url = `${this.baseApiUrl}/documents/upload`;
      return this.httpService.post(
            url,
            dmsUploadArray
        ).toPromise();
    }
}
