import { Test, TestingModule } from '@nestjs/testing';
import { DMSApiClientService } from './dms-api-client.service';

describe('DMSApiClientService', () => {
  let service: DMSApiClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DMSApiClientService],
    }).compile();

    service = module.get<DMSApiClientService>(DMSApiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
