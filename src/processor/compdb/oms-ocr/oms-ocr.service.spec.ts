import { Test, TestingModule } from '@nestjs/testing';
import { OmsOcrService } from './oms-ocr.service';

describe('OmsOcrService', () => {
  let service: OmsOcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OmsOcrService],
    }).compile();

    service = module.get<OmsOcrService>(OmsOcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
