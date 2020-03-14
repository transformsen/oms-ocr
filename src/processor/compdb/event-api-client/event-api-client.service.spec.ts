import { Test, TestingModule } from '@nestjs/testing';
import { EventApiClientService } from './event-api-client.service';

describe('EventApiClientService', () => {
  let service: EventApiClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventApiClientService],
    }).compile();

    service = module.get<EventApiClientService>(EventApiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
