import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event } from 'src/shared/event.interface';

@Injectable()
export class EventApiClientService {
    private baseApiUrl: string;
    constructor(configService: ConfigService,
        private httpService: HttpService){
            this.baseApiUrl = configService.get<string>(
                'WM_OMP_ROOT_URI_EVENT_API',
              );
        }
    
    postEvent(event: Event): Promise<any>{
      const url = `${this.baseApiUrl}/event`;
      return this.httpService.post(
            url,
            event
            ).toPromise();
    }
}
